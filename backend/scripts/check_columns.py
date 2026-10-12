import pyvo

svc = pyvo.dal.TAPService("https://irsa.ipac.caltech.edu/TAP")
res = svc.search("SELECT TOP 3 * FROM spherex.obscore")
print("COLUMNS:", res.fieldnames)
for row in res:
    print(dict(zip(res.fieldnames, row)))
