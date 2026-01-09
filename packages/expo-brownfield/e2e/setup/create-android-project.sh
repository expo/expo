#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_TEMPLATE="$DIR/../apps/android"

PROJECT_DIR=$1

mkdir -p $PROJECT_DIR/android
cp -r $PROJECT_TEMPLATE/* $PROJECT_DIR/android/
echo " ✅ Native Android project created at $PROJECT_DIR"

cd $PROJECT_DIR
echo $(ls -la android)
