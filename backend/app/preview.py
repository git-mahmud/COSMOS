import hashlib
import threading
import warnings
from pathlib import Path

import numpy as np
import requests
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image
from pyvo.dal.adhoc import DatalinkResults
from reproject import reproject_interp

from .irsa import get_observation

CACHE = Path(__file__).resolve().parent.parent / "cache"
CACHE.mkdir(exist_ok=True)

PIXEL_SCALE = 6.2  # arcsec per pixel (SPHEREx)
_jobs: dict[str, str] = {}


def _md5(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def _cache_path(obs_id: str) -> Path:
    return CACHE / (_md5(obs_id) + ".fits")


def _fits_url(access_url: str) -> str:
    dl = DatalinkResults.from_result_url(access_url)
    for row in dl:
        if str(getattr(row, "semantics", "")).endswith("#this") and row.access_url:
            return row.access_url
    raise RuntimeError("No FITS link found in the datalink answer")


def _download_full(obs_id: str) -> Path:
    path = _cache_path(obs_id)
    if not path.exists():
        obs = get_observation(obs_id)
        if not obs:
            raise LookupError("Observation not found")
        url = _fits_url(obs["access_url"])
        tmp = path.with_suffix(".part")
        with requests.get(url, stream=True, timeout=300) as r:
            r.raise_for_status()
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(1 << 20):
                    f.write(chunk)
        tmp.rename(path)
    return path


def prepare_status(obs_id: str) -> str:
    """Start a background download if needed. Returns downloading / ready / error: ..."""
    if _cache_path(obs_id).exists():
        return "ready"
    state = _jobs.get(obs_id)
    if state is None:
        _jobs[obs_id] = "downloading"

        def work():
            try:
                _download_full(obs_id)
                _jobs[obs_id] = "ready"
            except Exception as e:  # noqa: BLE001
                _jobs[obs_id] = f"error: {e}"

        threading.Thread(target=work, daemon=True).start()
        return "downloading"
    if state.startswith("error"):
        _jobs.pop(obs_id, None)  # next call will retry
    return state


def _target_wcs(ra: float, dec: float, n: int) -> WCS:
    w = WCS(naxis=2)
    w.wcs.ctype = ["RA---TAN", "DEC--TAN"]
    w.wcs.crval = [ra, dec]
    w.wcs.crpix = [(n + 1) / 2, (n + 1) / 2]
    s = PIXEL_SCALE / 3600
    w.wcs.cdelt = [-s, s]
    return w


def load_aligned(obs_id: str, ra: float, dec: float, size_deg: float) -> np.ndarray:
    npy = CACHE / (_md5(f"arr|{obs_id}|{ra:.5f}|{dec:.5f}|{size_deg}") + ".npy")
    if npy.exists():
        return np.load(npy)
    path = _download_full(obs_id)
    n = max(16, int(round(size_deg * 3600 / PIXEL_SCALE)))
    with fits.open(path) as hdul:
        try:
            hdu = hdul["IMAGE"]
        except KeyError:
            hdu = hdul[1]
        data = np.array(hdu.data, dtype=float)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            wcs_in = WCS(hdu.header, naxis=2)
    out, _ = reproject_interp((data, wcs_in), _target_wcs(ra, dec, n), shape_out=(n, n))
    np.save(npy, out)
    return out


def _stretch(data: np.ndarray, lo: float, hi: float) -> np.ndarray:
    s = np.clip((np.nan_to_num(data, nan=lo) - lo) / (hi - lo + 1e-12), 0, 1)
    return np.arcsinh(10 * s) / np.arcsinh(10)


def _save(scaled: np.ndarray, out: Path) -> Path:
    img = Image.fromarray((np.clip(scaled, 0, 1) * 255).astype(np.uint8)[::-1])  # north up
    img.save(out)
    return out


def render_png(obs_id: str, ra: float, dec: float, size_deg: float) -> Path:
    out = CACHE / (_md5(f"png|{obs_id}|{ra:.5f}|{dec:.5f}|{size_deg}") + ".png")
    if out.exists():
        return out
    data = load_aligned(obs_id, ra, dec, size_deg)
    finite = data[np.isfinite(data)]
    if finite.size == 0:
        raise RuntimeError("This sky spot is not inside the image")
    lo, hi = np.percentile(finite, [1, 99.5])
    return _save(_stretch(data, lo, hi), out)


def render_compare(a: str, b: str, ra: float, dec: float, size_deg: float, view: str) -> Path:
    out = CACHE / (_md5(f"cmp|{view}|{a}|{b}|{ra:.5f}|{dec:.5f}|{size_deg}") + ".png")
    if out.exists():
        return out
    A = load_aligned(a, ra, dec, size_deg)
    B = load_aligned(b, ra, dec, size_deg)
    if not (np.isfinite(A).any() and np.isfinite(B).any()):
        raise RuntimeError("This sky spot is not inside both images")
    A = A - np.nanmedian(A)  # remove each image's background level
    B = B - np.nanmedian(B)
    if view == "diff":
        D = B - A
        ok = np.isfinite(D)
        s = np.percentile(np.abs(D[ok]), 99) if ok.any() else 1.0
        scaled = 0.5 + 0.5 * np.clip(np.nan_to_num(D) / (s + 1e-12), -1, 1)
        scaled[~ok] = 0.5  # grey = no change
    else:
        both = np.concatenate([A[np.isfinite(A)], B[np.isfinite(B)]])
        lo, hi = np.percentile(both, [1, 99.5])
        scaled = _stretch(A if view == "a" else B, lo, hi)  # same brightness scale for A and B
    return _save(scaled, out)


def find_candidates(a, b, ra, dec, size_deg, sigma=5.0, max_n=20):
    from scipy import ndimage

    A = load_aligned(a, ra, dec, size_deg)
    B = load_aligned(b, ra, dec, size_deg)
    n = A.shape[0]
    if not (np.isfinite(A).any() and np.isfinite(B).any()):
        raise RuntimeError("This sky spot is not inside both images")
    A = A - np.nanmedian(A)
    B = B - np.nanmedian(B)
    D = B - A
    ok = np.isfinite(D)
    med = np.median(D[ok])
    noise = 1.4826 * np.median(np.abs(D[ok] - med))  # robust noise estimate
    fa = A[np.isfinite(A)]
    noise_a = 1.4826 * np.median(np.abs(fa - np.median(fa)))

    z = np.where(ok, (D - med) / (noise + 1e-12), 0.0)
    labels, count = ndimage.label(np.abs(z) > sigma)
    wcs = _target_wcs(ra, dec, n)

    found = []
    for i in range(1, count + 1):
        ys, xs = np.nonzero(labels == i)
        if len(xs) < 2:  # ignore single-pixel noise
            continue
        k = int(np.argmax(np.abs(z[ys, xs])))
        x, y = int(xs[k]), int(ys[k])
        win = A[max(0, y - 2): y + 3, max(0, x - 2): x + 3]
        bright = bool(np.isfinite(win).any() and np.nanmax(win) > 20 * noise_a)
        r, d = wcs.pixel_to_world_values(x, y)
        found.append({
            "ra": float(r),
            "dec": float(d),
            "x_frac": (x + 0.5) / n,
            "y_frac": 1 - (y + 0.5) / n,  # image is flipped so north is up
            "sigma": float(abs(z[y, x])),
            "sign": "brighter in B" if z[y, x] > 0 else "fainter in B",
            "area_px": int(len(xs)),
            "flag": "near a bright star: likely an alignment leftover" if bright else None,
            "status": "Needs review",
        })
    found.sort(key=lambda c: -c["sigma"])
    total = len(found)
    found = found[:max_n]
    for idx, c in enumerate(found, 1):
        c["id"] = idx
    return {"threeshold_sigma": sigma, "total": total, "candidates": found}