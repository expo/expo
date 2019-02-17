# expo-sensors

A Universal Module for acessing a hardware device's accelerometer, gyroscope, magnetometer, and pedometer.

**Note:** to access DeviceMotion stats on iOS, the NSMotionUsageDescription key must be present in your Info.plist.

## Installation

*If your app is running in [Expo](https://expo.io), then everything is already set up for you. Just `import { Accelerometer, Gyroscope, Magnetometer, Pedometer } from 'expo';`*

Otherwise, you need to install the package from `npm` registry.

`yarn add expo-sensors` or `npm install expo-sensors`

Also, make sure that you have [expo-core](https://github.com/expo/expo-core) installed, as it is required by `expo-sensors` to work properly.

### iOS

Add these dependencies to your `Podfile`:

```ruby
pod 'EXSensors', path: '../node_modules/expo-sensors/ios'
pod 'EXSensorsInterface', path: '../node_modules/expo-sensors-interface/ios'
```

and run `pod install` under the parent directory of your `Podfile`.

### Android

1. Append the following lines to `android/settings.gradle`:
   ```gradle
   include ':expo-sensors'
   project(':expo-sensors').projectDir = new File(rootProject.projectDir, '../node_modules/expo-sensors/android')
   ```
   and if not already included
   ```gradle
   include ':expo-sensors-interface'
   project(':expo-sensors-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-sensors-interface/android')
   ```
2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```gradle
   compile project(':expo-sensors')
   ```
   and if not already included
   ```gradle
   compile project(':expo-sensors-interface')
   ```
3.  Add `new SensorsPackage()` to your module registry provider in `MainApplication.java`. If consuming the Flutter plugin for this module, this is already done for you.

## Usage

See [Expo Docs](https://docs.expo.io) for documentation on usage for your specified sensor module.
