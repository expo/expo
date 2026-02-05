#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_TEMPLATE_UIKIT="$DIR/../apps/uikit"

PROJECT_DIR=$1

mkdir -p $PROJECT_DIR/uikit
rsync -av \
  --exclude='DerivedData' \
  --exclude='build' \
  --exclude='Pods' \
  --exclude='*.xcuserdatad' \
  --exclude='*.xcuserdata' \
  "$PROJECT_TEMPLATE_UIKIT/" "$PROJECT_DIR/uikit/"

echo " ✅ UIKit project created at $PROJECT_DIR/uikit"

# TODO: Setup SwiftUI project
