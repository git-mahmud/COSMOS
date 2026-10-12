import pyvo

svc = pyvo.dal.TAPService("https://irsa.ipac.caltech.edu/TAP")
ra, dec, r = 150.1, 2.2, 0.2

variants = {
    "A (poly, INTERSECTS)": f"SELECT TOP 5 obs_publisher_did, t_min FROM spherex.obscore WHERE INTERSECTS(CIRCLE('ICRS', {ra}, {dec}, {r}), poly)=1",
    "B (poly, CONTAINS point)": f"SELECT TOP 5 obs_publisher_did, t_min FROM spherex.obscore WHERE CONTAINS(POINT('ICRS', {ra}, {dec}), poly)=1",
    "C (s_ra/s_dec circle)": f"SELECT TOP 5 obs_publisher_did, t_min FROM spherex.obscore WHERE CONTAINS(POINT('ICRS', s_ra, s_dec), CIRCLE('ICRS', {ra}, {dec}, {r}))=1",
}

for name, q in variants.items():
    try:
        res = svc.search(q)
        print("WORKS:", name, "->", len(res), "rows")
    except Exception as e:
        print("FAILED:", name, "->", str(e)[:120])