// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAccelerometerInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXBarometerInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDeviceMotionInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXGyroscopeInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXMagnetometerInterface.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI48_0_0EXGravity = 9.80665;

@interface ABI48_0_0EXSensorsManager : NSObject <ABI48_0_0EXInternalModule, ABI48_0_0EXAccelerometerInterface, ABI48_0_0EXBarometerInterface, ABI48_0_0EXDeviceMotionInterface, ABI48_0_0EXGyroscopeInterface, ABI48_0_0EXMagnetometerInterface, ABI48_0_0EXMagnetometerUncalibratedInterface>

@end
