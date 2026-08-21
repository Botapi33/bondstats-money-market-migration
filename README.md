# BondStats — Where Is the Cash?

A production-oriented, mobile-first **Money Market Migration** dashboard for BondStats.

## What it tracks

- Bank deposits — Federal Reserve H.8 / FRED
- Money market fund assets — Federal Reserve Financial Accounts / FRED
- Marketable Treasury bills held by the public — U.S. Treasury Fiscal Data
- Overnight Reverse Repo Facility — Federal Reserve / FRED
- Reserve balances — Federal Reserve / FRED
- 3-month Treasury bill rate — Federal Reserve / FRED

## Why the methodology is conservative

The interface does not claim that each dollar leaving one pool moved directly into another. These are independently reported balance-sheet pools with different publication frequencies. BondStats compares their changes, preserves freshness metadata and labels the result as a migration signal rather than a literal flow map.

Missing periods remain unavailable; the UI never invents 1W/1M observations for a quarterly series.

## Automatic updates

The repository contains a weekday GitHub Action that:
1. downloads current public data,
2. rebuilds `data/money_market.json`,
3. validates the dataset,
4. syntax-checks the JavaScript,
5. commits only changed data.

No API key is required.

## Deploy

Recommended repository name:

`bondstats-money-market-migration`

1. Upload all files in this ZIP to the repository root.
2. GitHub → Settings → Pages → Source → **GitHub Actions**.
3. Actions → **Update liquidity data** → Run workflow once.
4. After the first successful data update, the normal Pages deploy runs automatically.

Expected URL:
`https://botapi33.github.io/bondstats-money-market-migration/`

## Google Sites

Insert → Embed → By URL → paste the GitHub Pages URL.

The interface is responsive and intended to retain the black institutional BondStats visual language.
