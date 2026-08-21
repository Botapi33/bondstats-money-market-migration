#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil, sys
ROOT=Path(__file__).resolve().parents[1]
required=[ROOT/"index.html",ROOT/"css/app.css",ROOT/"js/app.js",ROOT/"js/data-loader.js",ROOT/"js/migration-engine.js",ROOT/"js/chart.js"]
for p in required: assert p.exists() and p.stat().st_size>100,p
app=(ROOT/"js/app.js").read_text()
for token in ["renderPools","renderState","renderFlow","renderChart","renderSources"]:
    assert token in app,token
node=shutil.which("node")
if node:
    for p in [ROOT/"js/app.js",ROOT/"js/data-loader.js",ROOT/"js/migration-engine.js",ROOT/"js/chart.js"]:
        r=subprocess.run([node,"--check",str(p)],capture_output=True,text=True)
        if r.returncode:
            print(r.stderr);sys.exit(r.returncode)
print("Smoke test passed")
