# COSMOS: Explore the Changing Universe

NASA Space Apps Challenge 2026, SPHEREx challenge.

COSMOS lets anyone explore real SPHEREx observations, compare the same sky region at two moments, and investigate possible changes.

## Features
- Sky Explorer: search by RA/Dec, see real image footprints on a sky map (Aladin Lite)
- Time Machine: slider, blink, difference and side-by-side views of two aligned images
- Change Finder: lists spots where two images differ strongly, with evidence
- Discovery Journey: guided 5-step explanation for each candidate

## Honest limits
- Candidates are unconfirmed. A difference can also come from noise or small alignment errors.
- The signal number is a preliminary measure, not a calibrated probability.
- Images are compared on a 0.3 degree square, in one color band at a time.

## Data
SPHEREx data from NASA/IPAC Infrared Science Archive (IRSA). Map background: DSS2 via Aladin Lite (CDS).

## Run locally
Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --port 8000`
Frontend: `cd frontend && npm install && npm run dev`