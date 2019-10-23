#!/bin/bash
SMALLER_VERSION=$(($1 - 1))
sed -i .backup "s/1\.0\.$SMALLER_VERSION/1\.0\.$1/g" app.json App.tsx
rm *.backup
