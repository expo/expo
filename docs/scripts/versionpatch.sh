#!/bin/bash

src_version=$1

shift
for version in $*; do
    pushd versions/$version > /dev/null
    echo Patching in `pwd`
    git diff -- ../$src_version | patch -p4
    popd > /dev/null
done
