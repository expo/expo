#!/usr/bin/env bash

API_LEVEL=$1
emulator_name="bare-expo"
ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}

if $ANDROID_SDK_ROOT/tools/android list avd | grep -q $emulator_name; then
    echo " ☛  Found an existing an emulator named ${emulator_name}"
    exit 0;
fi

if [ $API_LEVEL -eq 23 ]
then
    PACKAGE="system-images;android-23;default;x86_64"
elif [ $API_LEVEL -eq 24 ]
then
    PACKAGE="system-images;android-24;default;x86_64"
elif [ $API_LEVEL -eq 34 ]
then
    PACKAGE="system-images;android-34;google_apis;arm64-v8a"
fi

echo uname -a

echo " ☛  Downloading the Android image to create an emulator..."
echo no | $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager $PACKAGE

echo "Package: $PACKAGE"

echo " ☛  Creating the emulator..."
echo no | $ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager \
    --verbose \
    create avd \
    --force \
    --name ${emulator_name} \
    --package "$PACKAGE" \
    --sdcard 300M

echo " ☛  Configuring the emulator..."

cat >> $HOME/.android/avd/${emulator_name}.avd/config.ini << EOF
hw.ramSize=2048
PlayStore.enabled = true
avd.ini.displayname = ${emulator_name}
hw.gpu.enabled=yes
hw.gpu.mode=host
hw.keyboard=yes
hw.camera.front=emulated
hw.camera.back=virtualscene
hw.device.manufacturer = Google
hw.device.name = pixel_7
hw.cpu.arch=arm64
hw.sdCard=yes
hw.lcd.density=420
hw.lcd.height=2400
hw.lcd.width=1080
showDeviceFrame=yes
skin.path=_no_skin
PlayStore.enabled=false
skin.name = pixel_7
abi.type=arm64
skin.path = ${HOME}/Library/Android/sdk/skins/pixel_7
avd.ini.encoding=UTF-8
image.sysdir.1=system-images/android-34/google_apis/arm64-v8a/
tag.id=default
tag.display=
EOF

echo " ☛  Emulator created"

