#!/usr/bin/env bash

sdk_manager="sdkmanager"

# Fallback to ANDROID_SDK_ROOT if sdkmanager is not found
if ! [ -x "$(command -v ${sdk_manager})" ]; then
  sdk_manager="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
fi

# Ensure the `sdkmanager` is installed for React Android
if ! [ -x "$(command -v ${sdk_manager})" ]; then
  echo "Error: You need to install Android SDK tools before proceeding. You can install these through Android Studio. Make sure that you also install the CLI tools and that sdkmanager can be found in your PATH."
  exit 1
fi

mkdir -p $HOME/.android
touch $HOME/.android/repositories.cfg

# Auto accept all the Google licenses
yes | ${sdk_manager} --licenses

sdk_manager_options='--no_https --verbose --channel=0'
# To launch the emulator by shell script
${sdk_manager} emulator ${sdk_manager_options}

# Install NDK...
${sdk_manager} "ndk;21.4.7075529" ${sdk_manager_options}
${sdk_manager} platform-tools ${sdk_manager_options}
# Install Intel HAXM (for emulators)
${sdk_manager} "extras;intel;Hardware_Accelerated_Execution_Manager" ${sdk_manager_options}
# Install the version of Android required for React Native
${sdk_manager} "platforms;android-26" "system-images;android-26;google_apis;x86_64" "build-tools;26.0.3" ${sdk_manager_options}
${sdk_manager} --update ${sdk_manager_options}

echo '✅  React Native is now setup'