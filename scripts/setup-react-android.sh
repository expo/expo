#!/usr/bin/env bash

# Downloading the rncache can fail easily so we just copy it.
# > This comes from `node_modules/react-native/src/rncache.json`
mkdir -p ~/.rncache
cp -f rncache/* ~/.rncache/

# React Native environment variables

# Ensure file
touch ~/.bash_profile

# Prevent duplication by searching for an existing value
ANDROID_PATH_EXIST=`cat ~/.bash_profile | grep ANDROID_HOME=`

if [ -z "$ANDROID_PATH_EXIST" ]; then
  echo '
    export ANDROID_HOME=$HOME/Library/Android/sdk
    export PATH=$PATH:$ANDROID_HOME/tools
    export PATH=$PATH:$ANDROID_HOME/tools/bin
    export PATH=$PATH:$ANDROID_HOME/platform-tools
  ' >> ~/.bash_profile
fi

# Reload the profile
source $HOME/.bash_profile

# Ensure the `sdkmanager` is installed for React Android
if [ ! -f "${ANDROID_HOME}/tools/bin/sdkmanager" ]; then
  echo "\nDownloading android sdk tools...\n"

  sdk_tools_url=`curl https://developer.android.google.cn/studio/ | egrep -o "https://dl.google.com/android/repository/sdk-tools-darwin-.+?\.zip"`
  sdk_tools_name=`basename ${sdk_tools_url}`
  # Remove possible existing copy
  rm -f ${sdk_tools_name}
  # Download and install `sdkmanager`
  curl -O ${sdk_tools_url}
  mkdir -p  ${ANDROID_HOME}
  tar -zxvf ${sdk_tools_name} -C ${ANDROID_HOME}
fi

mkdir -p $HOME/.android
touch $HOME/.android/repositories.cfg

# Auto accept all the Google licenses
yes | sdkmanager --licenses

sdk_manager_options='--no_https --verbose --channel=0'
# To launch the emulator by shell script
sdkmanager emulator ${sdk_manager_options}

# Install NDK...
sdkmanager ndk-bundle ${sdk_manager_options}
sdkmanager platform-tools ${sdk_manager_options}
# Install Intel HAXM (for emulators)
sdkmanager "extras;intel;Hardware_Accelerated_Execution_Manager" ${sdk_manager_options}
# Install the version of Android required for React Native
sdkmanager "platforms;android-26" "system-images;android-26;google_apis;x86_64" "build-tools;26.0.3" ${sdk_manager_options}
sdkmanager --update ${sdk_manager_options}

echo '✅  React Native is now setup'