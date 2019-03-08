#!/usr/bin/env bash

set -euo pipefail

touch out/versions/latest/introduction/installation.html

aws s3 sync out s3://docs.expo.io --delete

aws s3 cp \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public,max-age=31536000,immutable" \
  s3://docs.expo.io/_next/static/ \
  s3://docs.expo.io/_next/static/

# Temporarily create a redirect for a page that Home links to

aws s3 cp \
  --metadata-directive REPLACE \
  --website-redirect /versions/latest/introduction/installation/ \
  s3://docs.expo.io/versions/latest/introduction/installation.html \
  s3://docs.expo.io/versions/latest/introduction/installation.html
