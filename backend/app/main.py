from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from . import irsa, preview
from .config import CORS_ORIGINS

app = FastAPI(title="COSMOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/observations")
def search(
    ra: float = Query(..., ge=0, le=360),
    dec: float = Query(..., ge=-90, le=90),
    radius: float = Query(0.1, gt=0, le=2, description="degrees"),
    limit: int = Query(50, ge=1, le=200),
):
    try:
        items = irsa.search_observations(ra, dec, radius, limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IRSA archive error: {e}")
    return {"count": len(items), "results": items}


# Observation IDs contain '?' and '/', so we pass them as a query parameter
@app.get("/api/observation")
def observation(id: str):
    try:
        item = irsa.get_observation(id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"IRSA archive error: {e}")
    if not item:
        raise HTTPException(status_code=404, detail="Observation not found")
    return item


@app.get("/api/preview")
def get_preview(
    id: str,
    ra: float,
    dec: float,
    size: float = Query(0.3, gt=0, le=1, description="degrees"),
):
    try:
        path = preview.render_png(id, ra, dec, size)
    except LookupError:
        raise HTTPException(status_code=404, detail="Observation not found")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Preview error: {e}")
    return FileResponse(path, media_type="image/png")


@app.get("/api/prepare")
def prepare(id: str):
    return {"state": preview.prepare_status(id)}


@app.get("/api/compare")
def compare(
    a: str,
    b: str,
    ra: float,
    dec: float,
    size: float = Query(0.3, gt=0, le=1),
    view: str = Query("diff", pattern="^(a|b|diff)$"),
):
    try:
        path = preview.render_compare(a, b, ra, dec, size, view)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Compare error: {e}")
    return FileResponse(path, media_type="image/png")


@app.get("/api/candidates")
def candidates(
    a: str,
    b: str,
    ra: float,
    dec: float,
    size: float = Query(0.3, gt=0, le=1),
    sigma: float = Query(5.0, ge=3, le=10),
):
    try:
        return preview.find_candidates(a, b, ra, dec, size, sigma)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Candidate error: {e}")


_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _dist.exists():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="site")