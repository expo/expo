#!/bin/bash

ROOT_BRANCH="master"
CIRCLE_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
# CIRCLE_WORKING_DIRECTORY=$PWD
ROOT_COMMIT=$(git merge-base remotes/origin/"${CIRCLE_BRANCH}" "${ROOT_BRANCH}")
# echo "current branch -> ${CIRCLE_BRANCH}"
for file in $CIRCLE_WORKING_DIRECTORY/*/
do
    FILE_NAME=$(basename $file)
    if [[ ! " ${@} " =~ " ${FILE_NAME} " ]]; then
        if [ ! $CIRCLE_BRANCH = $ROOT_BRANCH ]; then
            # MASTER_LAST_COMMIT=$(git log -1 origin/"${ROOT_BRANCH}" --format=format:%H --full-diff "${file}")
            ROOT_FILE_HASH=$(git log -1 "${ROOT_COMMIT}" --format=format:%H --full-diff "${file}")
            CURRENT_FILE_HASH=$(git log -1 --format=format:%H --full-diff "${file}")
            if [ ! $ROOT_FILE_HASH = $CURRENT_FILE_HASH ]; then
                # circleci-agent step halt
                exit 1
                # echo $FILE_NAME
            fi
        fi
    fi
done