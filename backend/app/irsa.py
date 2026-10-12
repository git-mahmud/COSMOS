import time
import pyvo
from astropy.time import Time

from .config import TAP_URL, OBSCORE_TABLE, MAX_RESULTS, CACHE_SECONDS

_service = pyvo.dal.TAPService(TAP_URL)
_cache: dict[str, tuple[float, list]] = {}

COLUMNS = (
    "obs_publisher_did, s_ra, s_dec, t_min, t_max, "
    "em_min, em_max, access_url, calib_level"
)


def _run(query: str, maxrec: int):
    """Try a synchronous TAP query first, fall back to an async job."""
    try:
        return _service.search(query, maxrec=maxrec)
    except Exception:
        job = _service.submit_job(query, maxrec=maxrec)
        job.run()
        job.wait(phases=["COMPLETED", "ERROR", "ABORTED"], timeout=180)
        job.raise_if_error()
        return job.fetch_result()


def _mjd_to_iso(mjd):
    try:
        return Time(float(mjd), format="mjd").utc.isot
    except Exception:
        return None


def _get(row, key):
    try:
        v = row[key]
        return None if v is None or str(v) == "--" else v
    except Exception:
        return None


def _row_to_dict(row) -> dict:
    em_min, em_max = _get(row, "em_min"), _get(row, "em_max")
    return {
        "source_id": str(_get(row, "obs_publisher_did")),
        "ra": float(_get(row, "s_ra")) if _get(row, "s_ra") is not None else None,
        "dec": float(_get(row, "s_dec")) if _get(row, "s_dec") is not None else None,
        "observed_start": _mjd_to_iso(_get(row, "t_min")),
        "observed_end": _mjd_to_iso(_get(row, "t_max")),
        # ObsCore wavelengths are in metres; convert to micrometres
        "wavelength_um": [
            float(em_min) * 1e6 if em_min is not None else None,
            float(em_max) * 1e6 if em_max is not None else None,
        ],
        "access_url": str(_get(row, "access_url")),
        "calib_level": int(_get(row, "calib_level")) if _get(row, "calib_level") is not None else None,
        "data_release": "IRSA SPHEREx (see archive for release)",
    }


def search_observations(ra: float, dec: float, radius_deg: float, limit: int = 50):
    limit = min(limit, MAX_RESULTS)
    key = f"{ra:.5f}|{dec:.5f}|{radius_deg:.4f}|{limit}"

    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return hit[1]

    query = (
        f"SELECT TOP {limit} {COLUMNS} FROM {OBSCORE_TABLE} "
        f"WHERE CONTAINS(POINT('ICRS', {ra}, {dec}), poly)=1"
    )
    result = _run(query, maxrec=limit)
    rows = [_row_to_dict(r) for r in result]
    rows.sort(key=lambda r: r["observed_start"] or "")
    _cache[key] = (time.time(), rows)
    return rows


def get_observation(source_id: str):
    safe = source_id.replace("'", "''")
    query = (
        f"SELECT TOP 1 {COLUMNS} FROM {OBSCORE_TABLE} "
        f"WHERE obs_publisher_did = '{safe}'"
    )
    result = _run(query, maxrec=1)
    rows = [_row_to_dict(r) for r in result]
    return rows[0] if rows else None
