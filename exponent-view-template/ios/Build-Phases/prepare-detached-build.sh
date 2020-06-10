#!/usr/bin/env bash

set -eo pipefail

export PATH="$(yarn global bin):$PATH"
expo prepare-detached-build --platform ios "${SRCROOT}/.."
