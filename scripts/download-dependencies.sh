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
# We can install yarn because `npm install` is cross-platform
require yarn || npm install -g yarn

require direnv

# Set up submodules
git submodule update --init
git submodule foreach --recursive git checkout .

# Pull the large git files
git lfs pull

# Install the dependencies
yarn
