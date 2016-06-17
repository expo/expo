#!/bin/sh

gcloud docker -- run -ti --rm -v `pwd`:/root/docs -p 8000:8000 gcr.io/exponentjs/docs-builder make serve
