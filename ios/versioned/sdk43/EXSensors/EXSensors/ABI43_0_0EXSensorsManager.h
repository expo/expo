// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAccelerometerInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXBarometerInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDeviceMotionInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXGyroscopeInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXMagnetometerInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI43_0_0EXGravity = 9.80665;

@interface ABI43_0_0EXSensorsManager : NSObject <ABI43_0_0EXInternalModule, ABI43_0_0EXAccelerometerInterface, ABI43_0_0EXBarometerInterface, ABI43_0_0EXDeviceMotionInterface, ABI43_0_0EXGyroscopeInterface, ABI43_0_0EXMagnetometerInterface, ABI43_0_0EXMagnetometerUncalibratedInterface>

@end
