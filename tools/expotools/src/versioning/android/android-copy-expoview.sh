#!/usr/bin/env bash
# Usage: ./android-copy-native-modules 4.0.0 copies native modules to abi4_0_0.host.exp.exponent
# Requires $EXPO_ROOT_DIR to be defined in the environment.

ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
VERSIONED_ABI_PATH=versioned-abis/expoview-$ABI_VERSION
TOOLS_DIR=`pwd`

pushd $EXPO_ROOT_DIR/android

mkdir -p $VERSIONED_ABI_PATH/src/main/java

# Prepare build.gradle of the new expoview-abiXX_X_X subproject
awk '
  /WHEN_VERSIONING_REMOVE_FROM_HERE/ { removing = 1 }
  /WHEN_VERSIONING_REMOVE_TO_HERE/ { stopRemoving = 1 }
  // { if (removing == 0) print $0 }
  // { if (stopRemoving == 1) removing = 0 }
  // { if (removing == 0) stopRemoving = 0 }
' expoview/build.gradle > $VERSIONED_ABI_PATH/build.gradle
sed -i '' "s/\/\/ WHEN_VERSIONING_REPLACE_WITH_DEPENDENCIES/implementation project(\":expoview\")/g" $VERSIONED_ABI_PATH/build.gradle

# Prepare an empty AndroidManifest.xml of the new project
awk '
  /WHEN_VERSIONING_REMOVE_FROM_HERE/ { removing = 1 }
  /WHEN_VERSIONING_REMOVE_TO_HERE/ { stopRemoving = 1 }
  // { if (removing == 0) print $0 }
  // { if (stopRemoving == 1) removing = 0 }
  // { if (removing == 0) stopRemoving = 0 }
' expoview/src/main/AndroidManifest.xml > $VERSIONED_ABI_PATH/src/main/AndroidManifest.xml
sed -i '' "s/host.exp.expoview/$ABI_VERSION.host.exp.expoview/g" $VERSIONED_ABI_PATH/src/main/AndroidManifest.xml
sed -i '' "s/versioned.host.exp.exponent/$ABI_VERSION.host.exp.exponent/g" $VERSIONED_ABI_PATH/src/main/AndroidManifest.xml

# Add the new expoview-abiXX_X_X subproject to root project
NEWLINE='\
'
SED_APPEND_COMMAND=" a$NEWLINE"
sed -i '' "/ADD_NEW_SUPPORTED_ABIS_HERE/$SED_APPEND_COMMAND\ \ \ \ \"$ABI_VERSION\",$NEWLINE" settings.gradle

# Copy all the versioned code
cp -r expoview/src/main/java/versioned/ $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION

# Rename references to other packages previously under versioned.host.exp.exponent
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import versioned\.host\.exp\.exponent/import $ABI_VERSION\.host\.exp\.exponent/g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import expo\./import $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import static versioned\.host\.exp\.exponent/import static $ABI_VERSION\.host\.exp\.exponent/g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import static expo\./import static $ABI_VERSION\.expo\./g"
find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/package versioned\.host\.exp\.exponent/package $ABI_VERSION\.host\.exp\.exponent/g"

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)$PACKAGE/\1temporarydonotversion.$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-keep.txt

# Rename references to react native
while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import $PACKAGE/import $ABI_VERSION.$PACKAGE/g"
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/import static $PACKAGE/import static $ABI_VERSION.$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-rename.txt

while read PACKAGE
do
  find $VERSIONED_ABI_PATH/src/main/java/$ABI_VERSION \( -iname '*.java' -or -iname '*.kt' \) -type f -print0 | xargs -0 sed -i '' "s/\([, ^\(<]\)temporarydonotversion.$PACKAGE/\1$PACKAGE/g"
done < $TOOLS_DIR/android-packages-to-keep.txt

popd
