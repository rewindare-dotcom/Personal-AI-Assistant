#!/usr/bin/env bash
set -euo pipefail
rm -rf site website
rm -rf demo/showcase demo/mobilegym/screenshots
rm -rf docs/readme docs/zh docs/releases docs/screenshots
rm -f docs/cover.png docs/showcase.md CITATION.cff CODE_OF_CONDUCT.md
rm -f assets/brand/nanomuse-cover.png assets/brand/nanomuse-cover.svg
rm -f assets/brand/devices-loop.png assets/brand/nanoMuse-logo-and-text.png
rm -f assets/brand/nanoMuse.drawio assets/brand/nanomuse-icon-source-1024.png
rm -f .github/workflows/showcase.yml
echo cleanup done
