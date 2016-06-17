#!/bin/sh

set -e

docker build -t gcr.io/exponentjs/docs-builder:latest -f _resources/builder.Dockerfile .
