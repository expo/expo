#!/usr/bin/env bash
# Copyright 2019-present 650 Industries. All rights reserved.

# exit when any command fails
set -euo pipefail

# Erase current file
echo "" > .github/labeler.yml 

function appendPackage {
    packageName=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')

    if ! [ -z $(echo "$packageName" | awk /^expo/ || :) ]; then
        prettyPackageName=$(echo "$packageName" | awk -F'expo-' '{print $NF}')
        # prettyPackageName=$(echo "$prettyPackageName" | gsed -E 's/-([a-z])/\U\1/g')

        echo "${prettyPackageName}:" >> ../../.github/labeler.yml 
        echo "- packages/${1}/**/*" >> ../../.github/labeler.yml 

        printf "✨ \e[1m\e[32m${prettyPackageName}\e[00m added to Labeler\n";
    fi
}

for file in $PWD/packages/*/
do
    FILE_NAME=$(basename $file)
    if [ -f "$file/package.json" ]; then
        pushd $file > /dev/null
        appendPackage $FILE_NAME
        popd > /dev/null
    fi
done
