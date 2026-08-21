# BondStats — Money Market Migration v2

A redesigned, production-oriented liquidity dashboard with the same analytical functionality as v1 but a distinct visual identity.

## Important change: GitHub Actions is now simpler

The old version used one workflow to update `money_market.json`, commit it back to `main`, and another workflow to deploy. That can fail when repository workflow permissions or branch protection prevent automated pushes.

**v2 no longer pushes generated data back to the repository.**

A single workflow now:

1. checks out the repository,
2. downloads the latest official data,
3. builds `data/money_market.json` inside the GitHub runner,
4. validates all five liquidity pools,
5. syntax-checks the JavaScript,
6. uploads that built version directly to GitHub Pages.

This means branch write permission is no longer needed.

## Data

- Bank deposits — Federal Reserve H.8 / FRED
- Money market fund assets — Federal Reserve Financial Accounts / FRED
- Treasury bills — U.S. Treasury Fiscal Data
- ON RRP — Federal Reserve / FRED
- Reserve balances — Federal Reserve / FRED
- 3M Treasury bill rate — Federal Reserve / FRED

No API key is required.

## Deploy

Recommended repo:

`bondstats-money-market-migration`

1. Upload this ZIP's contents directly into the repository root.
2. GitHub → **Settings → Pages**.
3. Under **Build and deployment**, set **Source = GitHub Actions**.
4. Open **Actions → Build live data and deploy**.
5. Click **Run workflow** once.
6. When it finishes, open:
   `https://botapi33.github.io/bondstats-money-market-migration/`

The same workflow then runs automatically each weekday.

## If Actions is disabled

Repo → Settings → Actions → General → **Allow all actions and reusable workflows**.

Under Workflow permissions, read-only is sufficient for this v2 deployment because the workflow no longer commits generated files back to the repo.

## Methodology

The dashboard compares changes in balance-sheet pools. It does not claim that every dollar leaving one pool moved directly into another. Different source series also have different frequencies, which remain visible in the UI. Missing high-frequency observations are never invented.
