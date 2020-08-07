#!/usr/bin/env bash

set -eo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/.. && pwd )"

CLANG_FORMAT=$ANDROID_NDK/toolchains/llvm/prebuilt/linux-x86_64/bin/clang-format

cd $ROOT_DIR/cpp && find . \( -iname "*.h" -or -iname "*.cpp" \) -exec $CLANG_FORMAT --style=file -i {} \;
