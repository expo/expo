#!/usr/bin/env bash
# Usage: ./android-copy-universal-module 4.0.0 universal-module/.../android
# Requires $EXPO_ROOT_DIR to be defined in the environment.

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION
TOOLS_DIR=`pwd`

pushd $EXPO_ROOT_DIR/android

cp -r $2/src/main/java/* $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent

find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname 'flutter' -type d -print0 | xargs -0 rm -r

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)$PACKAGE/\1temporarydonotversion.$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-keep.txt

# Rename references to react native
while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)$PACKAGE/\1$ABI_VERSION.$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-rename.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)temporarydonotversion.$PACKAGE/\1$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-keep.txt

popd
