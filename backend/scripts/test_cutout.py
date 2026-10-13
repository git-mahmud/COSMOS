import requests
from pyvo.dal.adhoc import DatalinkResults

ACCESS = "https://irsa.ipac.caltech.edu/datalink/links/spherex?ID=ivo://irsa.ipac/spherex_qr2?2025W17_4B_0043_1/D1"
RA, DEC = 151.8144, 2.8263

dl = DatalinkResults.from_result_url(ACCESS)
print("DATALINK ROWS:")
base = None
for row in dl:
    print(" -", getattr(row, "semantics", None), "|", getattr(row, "content_type", None), "|", row.access_url, "| service_def:", getattr(row, "service_def", None))
    if str(getattr(row, "semantics", "")).endswith("#this") and row.access_url:
        base = row.access_url
print("BASE:", base)

variants = {
    "no params": base,
    "center/size": f"{base}?center={RA},{DEC}&size=0.3deg",
    "POS/SIZE": f"{base}?POS={RA},{DEC}&SIZE=0.3",
}
for name, url in variants.items():
    try:
        r = requests.get(url, stream=True, timeout=60)
        print(name, "->", r.status_code, r.headers.get("Content-Type"), r.headers.get("Content-Length"))
        r.close()
    except Exception as e:
        print(name, "-> FAILED", str(e)[:100])