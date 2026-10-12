from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import irsa
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
