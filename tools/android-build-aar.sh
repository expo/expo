#!/bin/bash
# Usage: ./android-build-aar 4.0.0 builds versioned-react-native and packages it into an aar
# with packages renamed. Must rename the JNI code before using this.

ORIGINAL_ABI_VERSION=`echo $1`
ABI_VERSION=`echo $1 | sed 's/\./_/g'`
ABI_VERSION="abi$ABI_VERSION"
TOOLS_DIR=`pwd`

pushd ../android

# Clean aar
rm -rf expoview/libs/ReactAndroid-temp
rm versioned-react-native/ReactAndroid/build/outputs/aar/ReactAndroid-release.aar

# Build aar
pushd versioned-react-native
# The build directory sometimes has old .so files
rm -rf ReactAndroid/build
set -e
./gradlew assembleRelease
popd

# Grab the aar and unzip it
cp versioned-react-native/ReactAndroid/build/outputs/aar/ReactAndroid-release.aar expoview/libs/ReactAndroid-temp.aar
rm -rf expoview/libs/ReactAndroid-temp
unzip expoview/libs/ReactAndroid-temp.aar -d expoview/libs/ReactAndroid-temp

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
java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/classes.jar expoview/libs/ReactAndroid-temp/classes.jar
java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/libs/infer-annotations-4.0.jar expoview/libs/ReactAndroid-temp/libs/infer-annotations-4.0.jar

# Fix packages that we don't want renamed
rm -f jarjar-rules.txt

while read PACKAGE
do
  echo "rule temporarydontversion.$PACKAGE.** $PACKAGE.@1" >> jarjar-rules.txt
done < $TOOLS_DIR/android-packages-to-keep.txt

java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/classes.jar expoview/libs/ReactAndroid-temp/classes.jar


pushd expoview/libs/ReactAndroid-temp
# Update the manifest. This is used for deduping in the build process
sed -i '' "s/com\.facebook\.react/$ABI_VERSION\.com\.facebook\.react/g" AndroidManifest.xml

# Can't rename libgnustl_shared so remove. We share the copy from ReactAndroid.
rm jni/armeabi-v7a/libgnustl_shared.so
rm jni/x86/libgnustl_shared.so

# Zip into aar
set +e
rm ../ReactAndroid-release-$ABI_VERSION.aar
set -e
zip -r ../ReactAndroid-release-$ABI_VERSION.aar .
popd

# Put aar into local maven repo
mvn install:install-file -e -Dfile=expoview/libs/ReactAndroid-release-$ABI_VERSION.aar -DgroupId=host.exp -DartifactId=reactandroid-$ABI_VERSION -Dversion=1.0.0 -Dpackaging=aar
cp -r ~/.m2/repository/host/exp/reactandroid-$ABI_VERSION/ maven/host/exp/reactandroid-$ABI_VERSION

# Add new aar to expoview/build.gradle
NEWLINE='\
'
SED_APPEND_COMMAND=" a$NEWLINE"
REPLACE_TEXT='DO NOT MODIFY'
sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ api 'host.exp:reactandroid-$ABI_VERSION:1.0.0'$NEWLINE" expoview/build.gradle

# Update Constants.java
sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \ \ abiVersions.add(\"$ORIGINAL_ABI_VERSION\");$NEWLINE" expoview/src/main/java/host/exp/exponent/Constants.java

# Add new version

# Update places that need to reference all versions of react native
# THIS WILL PROBABLY BREAK OFTEN

# Update classes that implement DefaultHardwareBackBtnHandler
BACK_BUTTON_HANDLER_CLASS='com.facebook.react.modules.core.DefaultHardwareBackBtnHandler'
find expoview/src/main/java/host/exp/exponent -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/MultipleVersionReactNativeActivity extends ReactNativeActivity implements/MultipleVersionReactNativeActivity extends ReactNativeActivity implements $ABI_VERSION\.$BACK_BUTTON_HANDLER_CLASS,/"

# Update AndroidManifest
sed -i '' "/ADD DEV SETTINGS HERE \-\-\>/$SED_APPEND_COMMAND\ \ \ \ \<activity android:name=\"$ABI_VERSION.com.facebook.react.devsupport.DevSettingsActivity\"\/\>$NEWLINE" ../template-files/android/AndroidManifest.xml
popd
./add-stripe-activity-to-manifest.sh ../template-files/android/AndroidManifest.xml $ABI_VERSION
