# BondStats — Money Market Migration v3

This version fixes the GitHub Actions timeout failure visible in the prior workflow.

## What failed

The previous workflow made a single network request to FRED / Treasury and treated a read timeout as fatal. GitHub's runner therefore exited with code 1 before validation or deployment.

## v3 reliability model

- 90-second HTTP read timeout
- up to 4 attempts per source
- exponential retry delay
- each source fails independently
- if one official source is temporarily unavailable, the dashboard uses the last bundled observation for that series
- the site deploys as `LIVE / FALLBACK` instead of failing completely
- validation and JavaScript smoke tests still run before deployment
- no workflow needs permission to push generated data to `main`

This means a temporary FRED or Fiscal Data outage can no longer take the entire BondStats page offline.

## Deployment

1. Replace the existing repo contents with this v3 package.
2. Keep `.github/workflows/deploy.yml`.
3. Settings → Pages → Source = **GitHub Actions**.
4. Actions → **Build live data and deploy** → Run workflow.

The workflow will automatically retry official sources and deploy safely even if one data provider temporarily times out.
