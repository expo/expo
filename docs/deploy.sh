#!/usr/bin/env bash

set -xeuo pipefail

environment=$1
export TAG=$2

nix run expo.k8s-services.docs.$environment.deploy --command deploy
