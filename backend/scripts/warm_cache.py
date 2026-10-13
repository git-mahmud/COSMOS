import sys

sys.path.insert(0, ".")

from app.preview import _download_full

IDS = [
    "ivo://irsa.ipac/spherex_qr2?2025W17_4B_0043_1/D1",
    "ivo://irsa.ipac/spherex_qr2?2025W19_2B_0103_1/D1",
]

for i in IDS:
    print("Downloading", i, "... (this can take a few minutes)", flush=True)
    path = _download_full(i)
    print("  saved:", path.name, round(path.stat().st_size / 1e6, 1), "MB", flush=True)

print("DONE")