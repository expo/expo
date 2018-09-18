#!/bin/bash
# Usage: ./android-copy-native-modules 4.0.0 copies native modules to abi4_0_0.host.exp.exponent

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"

pushd ../android

cp -r expoview/src/main/java/versioned expoview/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent
find expoview/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import versioned\.host\.exp\.exponent/import $ABI_VERSION\.host\.exp\.exponent/g"
find expoview/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static versioned\.host\.exp\.exponent/import static $ABI_VERSION\.host\.exp\.exponent/g"
find expoview/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/package versioned\.host\.exp\.exponent/package $ABI_VERSION\.host\.exp\.exponent/g"
# Rename references to react native
while read PACKAGE
do
  find expoview/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import $PACKAGE/import $ABI_VERSION.$PACKAGE/g"
  find expoview/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/import static $PACKAGE/import static $ABI_VERSION.$PACKAGE/g"
done < ../Tools/android-packages-to-rename.txt

popd
