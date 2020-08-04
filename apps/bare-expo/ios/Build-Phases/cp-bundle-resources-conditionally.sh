#!/usr/bin/env bash

set -exo pipefail

SRC_FILE="${PROJECT_DIR}/BareExpo/GoogleService-Info.plist"
DST_FILE="${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
if [ -f $SRC_FILE ]; then
    if [[ $(grep -L "NO_CLIENT_ID" "$SRC_FILE") ]]; then
        cp -r "$SRC_FILE" "$DST_FILE"
    fi
fi
