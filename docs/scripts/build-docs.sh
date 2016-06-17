#!/bin/sh

set -e

echo "Building docs..."
gcloud docker run -ti --rm -v $(pwd):/root/docs gcr.io/exponentjs/docs-builder:latest make html
echo "Built docs."
