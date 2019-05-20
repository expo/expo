#!/bin/bash
# Usage: ./android-build-aar 4.0.0 builds versioned-react-native and packages it into an aar
# with packages renamed. Must rename the JNI code before using this.

ORIGINAL_ABI_VERSION=`echo $1`
MAJOR_ABI_VERSION=`echo $1 | sed 's/\..*//g'`
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

# fix annotations
unzip expoview/libs/ReactAndroid-temp/annotations.zip -d expoview/libs/ReactAndroid-temp/annotations
mv expoview/libs/ReactAndroid-temp/annotations/com expoview/libs/ReactAndroid-temp/annotations/$ABI_VERSION
find expoview/libs/ReactAndroid-temp/annotations -type f > annotations_xmls
while read FILE
do
  while read PACKAGE
  do
    sed -i '' "s/$PACKAGE/$ABI_VERSION.$PACKAGE/g" $FILE
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

java -jar $TOOLS_DIR/jarjar-1.4.jar process jarjar-rules.txt expoview/libs/ReactAndroid-temp/classes.jar expoview/libs/ReactAndroid-temp/classes.jar


pushd expoview/libs/ReactAndroid-temp
# Update the manifest. This is used for deduping in the build process
sed -i '' "s/com\.facebook\.react/$ABI_VERSION\.com\.facebook\.react/g" AndroidManifest.xml

# Can't rename libc++_shared so remove. We share the copy from ReactAndroid.
rm -rf jni/*/libc++_shared.so

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
ADD_NEW_SDKS_HERE='ADD_NEW_SDKS_HERE'
sed -i '' "/$ADD_NEW_SDKS_HERE/$SED_APPEND_COMMAND$ADD_NEW_SDKS_HERE$NEWLINE$NEWLINE\ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ implementation(project(':expoview-$ABI_VERSION'))$NEWLINE\ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" app/build.gradle
sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ api 'host.exp:reactandroid-$ABI_VERSION:1.0.0'$NEWLINE\ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" expoview/build.gradle

# Update Constants.java
sed -i '' "/$REPLACE_TEXT/$SED_APPEND_COMMAND\ \ \ \ \/\/ BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ abiVersions.add(\"$ORIGINAL_ABI_VERSION\");$NEWLINE\ \ \ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE" expoview/src/main/java/host/exp/exponent/Constants.java

# Add new version

# Update places that need to reference all versions of react native
# THIS WILL PROBABLY BREAK OFTEN

# Update classes that implement DefaultHardwareBackBtnHandler
BACK_BUTTON_HANDLER_CLASS='com.facebook.react.modules.core.DefaultHardwareBackBtnHandler'
find expoview/src/main/java/host/exp/exponent -iname '*.java' -type f -print0 | xargs -0 sed -i '' "s/ADD_NEW_SDKS_HERE/BEGIN_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ $ABI_VERSION\.$BACK_BUTTON_HANDLER_CLASS,$NEWLINE\ \ \ \ \/\/ END_SDK_$MAJOR_ABI_VERSION$NEWLINE\ \ \ \ \/\/ ADD_NEW_SDKS_HERE/"

# Update AndroidManifest
sed -i '' "/ADD DEV SETTINGS HERE \-\-\>/$SED_APPEND_COMMAND\ \ \ \ \<!-- BEGIN_SDK_$MAJOR_ABI_VERSION --\>$NEWLINE\ \ \ \ \<activity android:name=\"$ABI_VERSION.com.facebook.react.devsupport.DevSettingsActivity\"\/\>$NEWLINE\ \ \ \ \<!-- END_SDK_$MAJOR_ABI_VERSION --\>$NEWLINE" ../template-files/android/AndroidManifest.xml
popd
./add-stripe-activity-to-manifest.sh ../template-files/android/AndroidManifest.xml $ABI_VERSION
