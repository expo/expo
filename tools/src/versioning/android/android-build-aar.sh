#!/bin/bash
# Usage: ./android-build-aar 4.0.0 builds versioned-react-native and packages it into an aar
# with packages renamed. Must rename the JNI code before using this.
# Requires $EXPO_ROOT_DIR to be defined in the environment.

ORIGINAL_ABI_VERSION=`echo $1`
MAJOR_ABI_VERSION=`echo $1 | sed 's/\..*//g'`
ABI_VERSION_NUMBER=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION_NUMBER"
TOOLS_DIR=`pwd`

SED_INPLACE_OPT=(-i '')
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  SED_INPLACE_OPT=(-i)
fi

pushd $EXPO_ROOT_DIR/android

export REACT_NATIVE_OVERRIDE_HERMES_DIR="$EXPO_ROOT_DIR/android/versioned-react-native/sdks/hermes"

# Clean aar
rm -rf expoview/libs/ReactAndroid-temp

# Build aar
pushd versioned-react-native
set -e
./gradlew :ReactAndroid:assembleRelease
./gradlew :ReactAndroid:hermes-engine:assembleRelease
popd

mkdir -p expoview/libs
# Grab the aar and unzip it
cp versioned-react-native/ReactAndroid/build/outputs/aar/ReactAndroid-release.aar expoview/libs/ReactAndroid-temp.aar
rm -rf expoview/libs/ReactAndroid-temp
unzip expoview/libs/ReactAndroid-temp.aar -d expoview/libs/ReactAndroid-temp

# Sanity check for renaming all the native libraries,
# but excluding prebuilt libraries like libc++_shared.so and libfbjni.so.
set +e
UNRENAMED_LIBS=`unzip -l expoview/libs/ReactAndroid-temp.aar | grep 'lib.*\.so' | grep -v "$ABI_VERSION" | grep -v 'libc++_shared.so' | grep -v 'libfbjni.so'`
if [ "x$UNRENAMED_LIBS" != "x" ]; then
  echo -e "\n\n👀 The following libraries have not been renamed. Please make sure to update \`tools/src/versioning/android/libraries.ts\`."
  echo "$UNRENAMED_LIBS"
  exit 1
fi
unset UNRENAMED_LIBS
set -e

# Write jarjar rules file. Used in next step to rename package
rm -f jarjar-rules.txt

while read PACKAGE
do
  echo "rule $PACKAGE.** temporarydontversion.$PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-keep.txt

while read PACKAGE
do
  echo "rule $PACKAGE.** $ABI_VERSION.$PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-rename.txt

# Rename packages in jars
java -jar $TOOLS_DIR/jarjar-1.4.1.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/classes.jar expoview/libs/ReactAndroid-temp/classes.jar

# fix annotations
unzip expoview/libs/ReactAndroid-temp/annotations.zip -d expoview/libs/ReactAndroid-temp/annotations
mv expoview/libs/ReactAndroid-temp/annotations/com expoview/libs/ReactAndroid-temp/annotations/$ABI_VERSION
find expoview/libs/ReactAndroid-temp/annotations -type f > annotations_xmls
while read FILE
do
  while read PACKAGE
  do
    sed "${SED_INPLACE_OPT[@]}" "s/$PACKAGE/$ABI_VERSION.$PACKAGE/g" $FILE
  done < $TOOLS_DIR/android-packages-to-rename.txt
done < annotations_xmls
rm annotations_xmls
pushd expoview/libs/ReactAndroid-temp/annotations
rm ../annotations.zip
zip -r ../annotations.zip .
rm -rf expoview/libs/ReactAndroid-temp/annotations
popd

# Fix packages that we don't want renamed
rm -f jarjar-rules.txt

while read PACKAGE
do
  echo "rule temporarydontversion.$PACKAGE.** $PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-keep.txt

java -jar $TOOLS_DIR/jarjar-1.4.1.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/classes.jar expoview/libs/ReactAndroid-temp/classes.jar


pushd expoview/libs/ReactAndroid-temp
# Update the manifest. This is used for deduping in the build process
sed "${SED_INPLACE_OPT[@]}" "s/com\.facebook\.react/$ABI_VERSION\.com\.facebook\.react/g" AndroidManifest.xml

# Can't rename libc++_shared so remove. We share the copy from ReactAndroid.
rm -rf jni/*/libc++_shared.so

# Zip into aar
set +e
rm ../ReactAndroid-release-$ABI_VERSION.aar
set -e
zip -r ../ReactAndroid-release-$ABI_VERSION.aar .
popd
rm -rf expoview/libs/ReactAndroid-temp

# Put aar into local maven repo
mvn install:install-file -e -Dfile=expoview/libs/ReactAndroid-release-$ABI_VERSION.aar -DgroupId=host.exp -DartifactId=reactandroid-$ABI_VERSION -Dversion=1.0.0 -Dpackaging=aar
rm expoview/libs/ReactAndroid-temp.aar
mkdir -p versioned-abis/expoview-$ABI_VERSION/maven/host/exp/reactandroid-$ABI_VERSION
cp -r ~/.m2/repository/host/exp/reactandroid-$ABI_VERSION/ versioned-abis/expoview-$ABI_VERSION/maven/host/exp/reactandroid-$ABI_VERSION
rm expoview/libs/ReactAndroid-release-$ABI_VERSION.aar

# Add new aar to expoview/build.gradle
NEWLINE='\
'
SED_APPEND_COMMAND=" a$NEWLINE"
REPLACE_TEXT='DO NOT MODIFY'
ADD_NEW_SDKS_HERE='ADD_NEW_SDKS_HERE'
sed "${SED_INPLACE_OPT[@]}" "/$ADD_NEW_SDKS_HERE/$SED_APPEND_COMMAND$NEWLINE$NEWLINE\ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ versionedImplementation(project(':expoview-$ABI_VERSION'))$NEWLINE\ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" app/build.gradle
sed "${SED_INPLACE_OPT[@]}" "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ versionedApi 'host.exp:reactandroid-$ABI_VERSION:1.0.0'$NEWLINE\ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" expoview/build.gradle

# Update Constants.java
sed "${SED_INPLACE_OPT[@]}" "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ abiVersions.add(\"$ORIGINAL_ABI_VERSION\");$NEWLINE\ \ \ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" expoview/src/main/java/host/exp/exponent/Constants.java

# Add new version

# Update places that need to reference all versions of react native
# THIS WILL PROBABLY BREAK OFTEN

# Update classes in `versioned` flavor that implement DefaultHardwareBackBtnHandler or PermissionAwareActivity
BACK_BUTTON_HANDLER_CLASS='com.facebook.react.modules.core.DefaultHardwareBackBtnHandler'
PERMISSION_AWARE_ACTIVITY_CLASS='com.facebook.react.modules.core.PermissionAwareActivity'
PERMISSION_LISTENER_CLASS='com.facebook.react.modules.core.PermissionListener'
find expoview/src/versioned/java/host/exp/exponent -iname '*.java' -type f -print0 | xargs -0 sed "${SED_INPLACE_OPT[@]}" -e "s/ADD_NEW_SDKS_HERE/BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ $ABI_VERSION\.$BACK_BUTTON_HANDLER_CLASS,$NEWLINE\ \ \ \ $ABI_VERSION\.$PERMISSION_AWARE_ACTIVITY_CLASS,$NEWLINE\ \ \ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ \/\/ ADD_NEW_SDKS_HERE/"
# Add implementation of PermissionAwareActivity.requestPermissions
find expoview/src/versioned/java/host/exp/exponent -iname '*.java' -type f -print0 | xargs -0 sed "${SED_INPLACE_OPT[@]}" "s/ADD_NEW_PERMISSION_AWARE_ACTIVITY_IMPLEMENTATION_HERE/BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ @Override$NEWLINE\ \ \ \ public\ void\ requestPermissions(String\[\]\ strings\,\ int\ i\,\ $ABI_VERSION\.$PERMISSION_LISTENER_CLASS\ permissionListener)\ {$NEWLINE\ \ \ \ \ \ super\.requestPermissions(strings\,\ i\,\ permissionListener::onRequestPermissionsResult);$NEWLINE\ \ \ \ }$NEWLINE\ \ \ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ \/\/ ADD_NEW_PERMISSION_AWARE_ACTIVITY_IMPLEMENTATION_HERE/"

popd
