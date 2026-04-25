#!/usr/bin/env bash

require() {
  if [[ -z $(command -v $1 2>/dev/null) ]]; then
    echo " 🛑  Please install $1 and try again"
    exit 1
  fi
}

require node
require npm
require git-lfs
require direnv

# Set up submodules
git submodule update --init
git submodule foreach --recursive git checkout .

# Pull the large git files
git lfs pull

if [[ "$1" == "--native" ]]; then
  # We can install pnpm because `npm install` is cross-platform
  require pnpm || npm install -g pnpm

  # Install the dependencies
  pnpm install

elif [[ "$1" == "--docs" ]]; then
  # pnpm is cross-platform; install globally if missing
  if ! command -v pnpm &>/dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
  fi

  # Install the dependencies
  (cd ./docs && pnpm install)

elif [[ -n "$1" ]]; then
  echo "Unknown option: $1"
fi
