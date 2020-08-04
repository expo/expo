#!/usr/bin/env bash

set -eo pipefail

yarn run expo prepare-detached-build --platform ios "${SRCROOT}/.."
