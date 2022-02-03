#!/usr/bin/env bash
# Usage: ./android-copy-universal-module 4.0.0 universal-module/.../android
# Requires $EXPO_ROOT_DIR to be defined in the environment.

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION
TOOLS_DIR=`pwd`
UNIMODULE_MANIFEST_PATH=$VERSIONED_ABI_PATH/src/main/UnimoduleAndroidManifest.xml

pushd $EXPO_ROOT_DIR/android

cp -r $2/src/main/java/* $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION
cp -r $2/src/main/kotlin/* $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION
cp -r $2/src/main/AndroidManifest.xml $UNIMODULE_MANIFEST_PATH

# Remove packages-to-keep

while read PACKAGE
do
  PACKAGE_DIR=${PACKAGE//\./\/}
  # $PACKAGE_DIR* catches both:
  # - FQDNs of classes, eg. org.unimodules.core.interfaces.Consumer which becomes org/.../Consumer*. which catches both .java and .kt
  # - packages, eg. org.unimodules.interfaces.taskManager which becomes a path
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION/$PACKAGE_DIR* \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 rm -rf
done < $TOOLS_DIR/android-packages-to-keep.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)$PACKAGE/\1temporarydonotversion.$PACKAGE/g"
  sed -i '' "s/$PACKAGE/temporarydonotversion.$PACKAGE/g" $UNIMODULE_MANIFEST_PATH
done < $TOOLS_DIR/android-packages-to-keep.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)$PACKAGE/\1$ABI_VERSION.$PACKAGE/g"
  sed -i '' "s/$PACKAGE/$ABI_VERSION.$PACKAGE/g" $UNIMODULE_MANIFEST_PATH
done < $TOOLS_DIR/android-packages-to-rename.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)temporarydonotversion.$PACKAGE/\1$PACKAGE/g"
  sed -i '' "s/temporarydonotversion.$PACKAGE/$PACKAGE/g" $UNIMODULE_MANIFEST_PATH
done < $TOOLS_DIR/android-packages-to-keep.txt

# Transform `// EXPO_VERSIONING_NEEDS_EXPOVIEW_R` comment as `import abiN_N_N.host.exp.expoview.R`
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/^\/\/ *EXPO_VERSIONING_NEEDS_EXPOVIEW_R/import $ABI_VERSION.host.exp.expoview.R;/g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION -iname '*.kt' -type f -print0 | xargs -0 sed -i '' "s/^\/\/ *EXPO_VERSIONING_NEEDS_EXPOVIEW_R/import $ABI_VERSION.host.exp.expoview.R/g"

java -jar $TOOLS_DIR/android-manifest-merger-3898d3a.jar \
     --main $VERSIONED_ABI_PATH/src/main/AndroidManifest.xml \
     --libs $UNIMODULE_MANIFEST_PATH \
     --placeholder applicationId=\${applicationId} \
     --out $VERSIONED_ABI_PATH/src/main/AndroidManifest.xml \
     --log WARNING

rm $UNIMODULE_MANIFEST_PATH

popd
