# COSMOS: Explore the Changing Universe

**Live demo:** https://cosmos-9wa2.onrender.com
*(Free hosting: the first visit can take about a minute to wake up.)*

COSMOS is a web app built for the **NASA Space Apps Challenge 2026** (SPHEREx challenge). It uses real observations from NASA's SPHEREx space telescope, lets anyone compare the same patch of sky at two different dates, and lists the spots that changed the most.

> Every result in COSMOS is a **candidate**, never a confirmed discovery.

![Sky Explorer](docs/sky-map.png)
![Time Machine](docs/time-machine.png)
![Change Finder](docs/change-finder.png)

## Features

- **Sky Explorer:** drag a real sky map (Aladin Lite), or search by RA and Dec, to find SPHEREx images covering any area. Each image has its date, band and sky position.
- **Time Machine:** pick an earlier image (A) and a later image (B) in the same band. Compare them with a Slider, Blink, Difference or Side by side view, and click to zoom in.
- **Change Finder:** scans the difference image and lists the strongest spots, with position, signal strength and a warning when a spot is next to a bright star.
- **Discovery Journey:** a guided five-step walkthrough (Observe, Compare, Investigate, Understand, Report) that explains each candidate using only the real numbers from the analysis. You can save your own report.

## How it works

1. The backend searches the NASA/IPAC Infrared Science Archive (IRSA) through TAP for images covering a sky position.
2. It downloads the selected FITS images and caches them.
3. It lines both images up on the same sky grid using their WCS (Astropy and reproject).
4. It builds the comparison pictures and finds candidate spots with a robust noise estimate and a threshold.
5. The React frontend shows everything in one connected workflow.

## Honest limits

- A candidate is a possible change. It is **not** a confirmed asteroid, comet or planet.
- Differences can also come from noise or small alignment errors. Spots next to bright stars are flagged because they are often leftovers.
- The signal number (times the normal noise) is a preliminary measure, not a calibrated probability.
- Only two images are compared at a time, on a 0.3 degree square, so a candidate needs more observations to be confirmed.
- SPHEREx pixels are large (about 6.2 arcseconds), so deep zooms look blocky. That is the real resolution.
- Compare only images from the same band. COSMOS warns you when the bands are different.

## Tech stack

| Part | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Aladin Lite |
| Backend | Python, FastAPI, Uvicorn |
| Science | Astropy, NumPy, SciPy, reproject, Pillow, PyVO |
| Data | SPHEREx via NASA/IPAC IRSA (TAP and datalink) |
| Hosting | Render |

## Project structure

```text
COSMOS/
├── backend/
│   ├── app/
│   │   ├── main.py        # API endpoints, serves the built website
│   │   ├── irsa.py        # searches the IRSA archive
│   │   ├── preview.py     # download, align, compare, find candidates
│   │   └── config.py
│   ├── scripts/           # small test and cache-warming scripts
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/    # SkyViewer, TimeMachine, Candidates, DiscoveryJourney, ...
│       ├── api.ts
│       └── App.tsx
└── README.md
```

## API

| Endpoint | What it does |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/observations?ra=&dec=` | Find SPHEREx images covering a sky position |
| `GET /api/observation?id=` | Details of one observation |
| `GET /api/prepare?id=` | Start downloading an image in the background |
| `GET /api/preview?id=&ra=&dec=` | One aligned image as PNG |
| `GET /api/compare?a=&b=&ra=&dec=&view=` | Aligned A, B or difference image as PNG |
| `GET /api/candidates?a=&b=&ra=&dec=` | Candidate spots between two images |

## Run it yourself

You need Python 3.12 and Node.js 20 or newer.

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api` calls to port 8000.

**One-service build** (the backend also serves the website)

```bash
cd frontend
npm run build
cd ../backend
uvicorn app.main:app --port 8000
```

Open http://localhost:8000.

Note: each new image is about 72 MB, so the first comparison of a new pair takes a minute or two. Downloaded images are cached in `backend/cache`.

## Data and credits

- Observations: **SPHEREx**, accessed through the **NASA/IPAC Infrared Science Archive (IRSA)**.
- Sky map background: **DSS2** survey, shown with **Aladin Lite** (CDS, Strasbourg).
- Built with Astropy, reproject and PyVO.

COSMOS is **not** an official NASA product.

## Author

**Mahmudur Rahman**, Computer Science student at Southeast University, Bangladesh.
Built for the NASA Space Apps Challenge 2026.