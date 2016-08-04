#!/bin/bash

if [[ $# -lt 2 ]]
then
    echo "applies the current git diff in source version in each target version"
    echo "can be used to, for example, make changes in "'unversioned'" then"
    echo "duplicate those changes in previous versions"
    echo
    echo "usage: from docs directory,"
    echo "  ./scripts/versionpatch.sh <src> <target1> <target2> ..."
    echo
    echo "example:"
    echo "  ./scripts/versionpatch.sh unversioned v8.0.0 v7.0.0"
    exit
fi

src_version=$1

shift
for version in $*; do
    pushd versions/$version > /dev/null
    echo Patching in `pwd`
    git diff -- ../$src_version | patch -p4
    popd > /dev/null
done
