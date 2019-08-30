#!/usr/bin/env bash
# Usage: ./android-copy-universal-module 4.0.0 universal-module/.../android

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION

pushd ../android

cp -r $2/src/main/java/* $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent

find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname 'flutter' -type d -print0 | xargs -0 rm -r

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(]\)$PACKAGE/\1temporarydonotversion.$PACKAGE/g"
done < ../tools/android-packages-to-keep.txt

# Rename references to react native
while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(]\)$PACKAGE/\1$ABI_VERSION.$PACKAGE/g"
done < ../tools/android-packages-to-rename.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(]\)temporarydonotversion.$PACKAGE/\1$PACKAGE/g"
done < ../tools/android-packages-to-keep.txt

IFS='/' read -r -a array <<< $2; 
UNIMODULE_NAME=${array[0]};

if [ $UNIMODULE_NAME = "expo-notifications" ]
then
  # Rename ORM classes
  while read CLASS_NAME
  do
    find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -E -i '' "s/($CLASS_NAME)/$ABI_VERSION\1/g";
  done < ../tools/classes-to-rename.txt
fi

popd
