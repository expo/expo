#!/usr/bin/env bash

set -eo pipefail

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )"/.. && pwd )"

CLANG_FORMAT=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/clang-format

cd $ROOT_DIR/common/cpp && find . \( -iname "*.h" -or -iname "*.cpp" \) -exec $CLANG_FORMAT --style=file -i {} \;

if command -v cmake-format &> /dev/null
then
  cmake-format -i --tab-size 4 $ROOT_DIR/android/CMakeLists.txt
fi
