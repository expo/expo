#!/bin/sh

set -e

gcloud docker -- build -t gcr.io/exponentjs/docs-builder:latest -f ./builder.Dockerfile .
