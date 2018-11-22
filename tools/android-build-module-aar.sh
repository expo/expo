#!/usr/bin/env bash
# Usage: ./android-build-module-aar expo-core 2.0.0 builds expo-core and packages it into an aar
# with packages renamed.

MODULE_NAME=`echo $1`
ABI_VERSION=`echo $2 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
TOOLS_DIR=`pwd`

pushd ../android

# Clean aar
rm -rf expoview/libs/$MODULE_NAME-temp
rm ../packages/$MODULE_NAME/android/build/outputs/aar/$MODULE_NAME-release.aar

# Build aar
pushd ../packages/$MODULE_NAME/android
# The build directory sometimes has old .so files
rm -rf build
popd
set -e
./gradlew $MODULE_NAME:assembleRelease

# Grab the aar and unzip it
cp ../packages/$MODULE_NAME/android/build/outputs/aar/$MODULE_NAME-release.aar expoview/libs/$MODULE_NAME-temp.aar
rm -rf expoview/libs/$MODULE_NAME-temp
unzip expoview/libs/$MODULE_NAME-temp.aar -d expoview/libs/$MODULE_NAME-temp

# # Write jarjar rules file. Used in next step to rename package
rm -f jarjar-rules.txt

while read PACKAGE
do
  echo "rule $PACKAGE.** temporarydontversion.$PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-keep.txt

while read PACKAGE
do
  echo "rule $PACKAGE.** $ABI_VERSION.$PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-rename.txt

# Version classes that must live in an unversioned package by renaming the classes themselves
while read CLASS
do
  echo "rule $CLASS $CLASS$ABI_VERSION" >> jarjar-rules.txt
done < $TOOLS_DIR/android-classes-to-rename.txt

# # Rename packages in jars
java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/$MODULE_NAME-temp/classes.jar expoview/libs/$MODULE_NAME-temp/classes.jar
# java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/$MODULE_NAME-temp/libs/infer-annotations-4.0.jar expoview/libs/$MODULE_NAME-temp/libs/infer-annotations-4.0.jar

# Fix packages that we don't want renamed
rm -f jarjar-rules.txt

while read PACKAGE
do
  echo "rule temporarydontversion.$PACKAGE.** $PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-keep.txt

java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/$MODULE_NAME-temp/classes.jar expoview/libs/$MODULE_NAME-temp/classes.jar


pushd expoview/libs/$MODULE_NAME-temp
# # Update the manifest. This is used for deduping in the build process
sed -i '' "s/expo\./$ABI_VERSION\.expo\./g" AndroidManifest.xml

# # Can't rename libgnustl_shared so remove. We share the copy from ReactAndroid.
# rm jni/armeabi-v7a/libgnustl_shared.so
# rm jni/x86/libgnustl_shared.so

# # Zip into aar
set +e
rm ../$MODULE_NAME-release-$ABI_VERSION.aar
set -e
zip -r ../$MODULE_NAME-release-$ABI_VERSION.aar .
popd

# # Put aar into local maven repo
mvn install:install-file -e -Dfile=expoview/libs/$MODULE_NAME-release-$ABI_VERSION.aar -DgroupId=host.exp.exponent -DartifactId=$MODULE_NAME-$ABI_VERSION -Dversion=1.0.0 -Dpackaging=aar
cp -r ~/.m2/repository/host/exp/exponent/$MODULE_NAME-$ABI_VERSION/ maven/host/exp/exponent/$MODULE_NAME-$ABI_VERSION

# # Add new aar to expoview/build.gradle
NEWLINE='\
'
SED_APPEND_COMMAND=" a$NEWLINE"
REPLACE_TEXT='DO NOT MODIFY'
sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ api 'host.exp.exponent:$MODULE_NAME-$ABI_VERSION:1.0.0'$NEWLINE" expoview/build.gradle

# # Update Constants.java
# sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \ \ abiVersions.add(\"$ORIGINAL_ABI_VERSION\");$NEWLINE" expoview/src/main/java/host/exp/exponent/Constants.java

# # Add new version

# # Update places that need to reference all versions of react native
# # THIS WILL PROBABLY BREAK OFTEN

# # Update classes that implement DefaultHardwareBackBtnHandler
# BACK_BUTTON_HANDLER_CLASS='com.facebook.react.modules.core.DefaultHardwareBackBtnHandler'
# find expoview/src/main/java/host/exp/exponent -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/MultipleVersionReactNativeActivity extends ReactNativeActivity implements/MultipleVersionReactNativeActivity extends ReactNativeActivity implements $ABI_VERSION\.$BACK_BUTTON_HANDLER_CLASS,/"

# # Update AndroidManifest
# sed -i '' "/ADD DEV SETTINGS HERE \-\-\>/$SED_APPEND_COMMAND\ \ \ \ \<activity android:name=\"$ABI_VERSION.com.facebook.react.devsupport.DevSettingsActivity\"\/\>$NEWLINE" ../template-files/android/AndroidManifest.xml

rm -rf expoview/libs/$MODULE_NAME-temp
rm -f expoview/libs/$MODULE_NAME-temp.aar
# rm -f expoview/libs/$MODULE_NAME-release-$ABI_VERSION.aar

popd
