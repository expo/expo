#!/usr/bin/env bash

set -exo pipefail

SRC_FILE="${PROJECT_DIR}/Exponent/Supporting/GoogleService-Info.plist"
DST_FILE="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
if [ -f $SRC_FILE ]; then
    cp -r "$SRC_FILE" "$DST_FILE"
fi

# Copy embedded Snack runtime if it exists
SNACK_RUNTIME_SRC="${PROJECT_DIR}/Exponent/Supporting/SnackRuntime"
SNACK_RUNTIME_DST="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/SnackRuntime"
if [ -d "$SNACK_RUNTIME_SRC" ]; then
    # Remove existing to avoid nested folders from cp -r
    rm -rf "$SNACK_RUNTIME_DST"
    cp -r "$SNACK_RUNTIME_SRC" "$SNACK_RUNTIME_DST"
fi
