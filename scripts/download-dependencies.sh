#!/usr/bin/env bash

# Node 
if [[ -z $(command -v node 2>/dev/null) ]]; then
  echo " 🛑  Please install node and try again"
  exit 1
fi
# NPM
if [[ -z $(command -v npm 2>/dev/null) ]]; then
  echo " 🛑  Please install npm and try again"
  exit 1
fi
if [[ -z $(command -v git-lfs 2>/dev/null) ]]; then
  echo " 🛑  Please install git-lfs and retry..."
  exit 1
fi

# Install yarn globally if it doesn't exist
if [[ -z $(command -v yarn 2>/dev/null) ]]; then
  # We can install yarn because `npm install` is cross-platform
  npm install -g yarn
fi

# Set up submodules
git submodule update --init
git submodule foreach --recursive git checkout .

# Pull the large git files
git lfs pull

# Install the dependencies
yarn
