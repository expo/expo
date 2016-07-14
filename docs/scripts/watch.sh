#!/bin/sh

if [ -n $1 ]; then
    VERSION_ARG="-e DEFAULT_VERSION=$1"
else
    VERSION_ARG=
fi

gcloud docker -- run -ti $VERSION_ARG --rm -v `pwd`:/root/docs -p 8000:8000 gcr.io/exponentjs/docs-builder make serve
