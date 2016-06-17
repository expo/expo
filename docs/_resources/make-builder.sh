#!/bin/sh

set -e

docker build -t gcr.io/exponenjs/docs-builder -f _resources/builder.Dockerfile .
