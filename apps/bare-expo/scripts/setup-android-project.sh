#!/usr/bin/env bash

echo " ☛  Ensuring Android project is setup..."

CURR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "${CURR_DIR}/.."

if [ -d "./node_modules" ]; then
    echo " ✅ Node modules installed"
else
    echo " ⚠️  Cannot find node modules for this project, installing..."
    pnpm install
fi
