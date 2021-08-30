#!/usr/bin/env bash

API_LEVEL=$1
emulator_name="bare-expo"
ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}

if $ANDROID_SDK_ROOT/tools/android list avd | grep -q $emulator_name; then
    echo " ☛  Found an existing an emulator named ${emulator_name}"
    exit 0;
fi

if [ $API_LEVEL -eq 21 ]
then
    PACKAGE="system-images;android-21;default;x86_64"
elif [ $API_LEVEL -eq 22 ]
then
    PACKAGE="system-images;android-22;default;x86_64"
elif [ $API_LEVEL -eq 23 ]
then
    PACKAGE="system-images;android-23;default;x86_64"
elif [ $API_LEVEL -eq 24 ]
then
    PACKAGE="system-images;android-24;default;x86_64"
fi

echo " ☛  Downloading the Android image to create an emulator..."
echo no | $ANDROID_SDK_ROOT/tools/bin/sdkmanager $PACKAGE

echo " ☛  Creating the emulator..."
echo no | $ANDROID_SDK_ROOT/tools/bin/avdmanager \
    --verbose \
    create avd \
    --force \
    --name ${emulator_name} \
    --abi default/x86_64 \
    --package $PACKAGE \
    --sdcard 300M

echo " ☛  Configuring the emulator..."

cat >> $HOME/.android/avd/${emulator_name}.avd/config.ini << EOF
hw.ramSize=2048
hw.gpu.enabled=yes
hw.gpu.mode=host
hw.keyboard=yes
hw.camera.front=emulated
hw.camera.back=virtualscene
hw.cpu.arch=x86_64
hw.sdCard=yes
hw.lcd.density=240
hw.lcd.width=480
hw.lcd.height=800
showDeviceFrame=yes
skin.path=_no_skin
PlayStore.enabled=false
abi.type=x86_64
avd.ini.encoding=UTF-8
image.sysdir.1=system-images/android-22/default/x86_64/
tag.id=default
tag.display=
EOF

echo " ☛  Emulator created"

