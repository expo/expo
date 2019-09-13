#!/usr/bin/env bash

# Required by ios
# Downloading rncache can be fail easily, so we just copy it.
# See node_modules/react-native/src/rncache.json
mkdir -p ~/.rncache
cp -f rncache/* ~/.rncache/

# Required by android
touch ~/.bash_profile
ANDROID_PATH_EXIST=`cat ~/.bash_profile | grep ANDROID_HOME=`
if [ -z "$ANDROID_PATH_EXIST" ]; then
  echo '
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/tools
    export PATH=$PATH:$ANDROID_HOME/tools/bin
    export PATH=$PATH:$ANDROID_HOME/platform-tools
  ' >> ~/.bash_profile
fi
source $HOME/.bash_profile

# Required for React Android to work
if [ ! -f "${ANDROID_HOME}/tools/bin/sdkmanager" ]; then
  echo ""
  echo "Downloading android sdk tools..."
  echo ""
  sdk_tools_url=`curl https://developer.android.google.cn/studio/ | egrep -o "https://dl.google.com/android/repository/sdk-tools-darwin-.+?\.zip"`
  sdk_tools_name=`basename ${sdk_tools_url}`
  rm -f ${sdk_tools_name}
  curl -O ${sdk_tools_url}
  mkdir -p  ${ANDROID_HOME}
  tar -zxvf ${sdk_tools_name} -C ${ANDROID_HOME}
fi

mkdir -p $HOME/.android
touch $HOME/.android/repositories.cfg

# Auto accept the licenses
yes | sdkmanager --licenses

# Required by android
# TODO: add mirror for china.
sdk_manager_options='--no_https --verbose --channel=0'
# To launch the emulator by shell script.
sdkmanager emulator ${sdk_manager_options}
# Fix warning: NDK is missing a "platforms" directory
sdkmanager ndk-bundle ${sdk_manager_options}
sdkmanager platform-tools ${sdk_manager_options}
# Intel HAXM
sdkmanager "extras;intel;Hardware_Accelerated_Execution_Manager" ${sdk_manager_options}
# React Native version required.
sdkmanager "platforms;android-26" "system-images;android-26;google_apis;x86_64" "build-tools;26.0.3" ${sdk_manager_options}
sdkmanager --update ${sdk_manager_options}

echo ''
echo '\033[33mInitialize Complete.\033[0m'
echo ''