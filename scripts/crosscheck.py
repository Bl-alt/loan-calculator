"""Independent reference implementation (Python Decimal) used to derive expected values
for src/core tests. Run: python3 scripts/crosscheck.py"""
import calendar
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP, getcontext

getcontext().prec = 40
K = D("0.01")


def r2(x):
    return x.quantize(K, rounding=ROUND_HALF_UP)


def add_months(d, k):
    t = d.year * 12 + d.month - 1 + k
    y, m = divmod(t, 12)
    return date(y, m + 1, min(d.day, calendar.monthrange(y, m + 1)[1]))


def daily(bal, rate, a, b):
    total = D(0)
    cur = a
    for y in range(a.year, b.year + 1):
        end = b if y == b.year else date(y, 12, 31)
        days = (end - cur).days
        if days > 0:
            total += bal * rate / 100 * days / (366 if calendar.isleap(y) else 365)
        cur = end
    return r2(total)


def schedule(S, rate, n, kind, mode="monthly", start=date(2025, 1, 15)):
    S, rate = D(S), D(rate)
    i = rate / 1200
    P = r2(S / n) if i == 0 else r2(S * i / (1 - (1 + i) ** -n))
    dp = r2(S / n)
    bal, prev, rows = S, start, []
    for k in range(1, n + 1):
        d = add_months(start, k)
        it = r2(bal * i) if mode == "monthly" else daily(bal, rate, prev, d)
        pr = (P - it) if kind == "annuity" else dp
        if k == n or pr > bal:
            pr = bal
        bal -= pr
        rows.append((d, pr + it, it, pr, bal))
        prev = d
        if bal == 0:
            break
    return rows


def show(title, rows):
    ti = sum(r[2] for r in rows)
    print(f"{title}: first={rows[0][1]} last={rows[-1][1]} interest={ti} rows={len(rows)}")


show("annuity 1e6 12% 12", schedule(1_000_000, 12, 12, "annuity"))
show("annuity 3e6 16.5% 240", schedule(3_000_000, "16.5", 240, "annuity"))
show("diff 1e6 12% 12", schedule(1_000_000, 12, 12, "diff"))
show("diff 500000 9.9% 36", schedule(500_000, "9.9", 36, "diff"))
show("annuity daily 1e6 12% 12 from 2023-12-15",
     schedule(1_000_000, 12, 12, "annuity", "daily", date(2023, 12, 15)))
show("annuity zero 100000 0% 7", schedule(100_000, 0, 7, "annuity"))

S, r, m = D(100_000), D(10), 12
bal = S
for _ in range(m):
    bal += r2(bal * r / 1200)
print("deposit cap 100000 10% 12:", bal, "formula:", r2(S * (1 + r / 1200) ** m))
bal, paid = D(100_000), D(0)
for k in range(1, 13):
    paid += r2(bal * r / 1200)
    if k < 12:
        bal += 5000
print("deposit simple 100000 10% 12 +5000:", bal + paid, "interest", bal + paid - 155000)
