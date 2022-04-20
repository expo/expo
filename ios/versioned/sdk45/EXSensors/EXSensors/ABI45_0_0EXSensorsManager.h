// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAccelerometerInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXBarometerInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDeviceMotionInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXGyroscopeInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXMagnetometerInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI45_0_0EXGravity = 9.80665;

@interface ABI45_0_0EXSensorsManager : NSObject <ABI45_0_0EXInternalModule, ABI45_0_0EXAccelerometerInterface, ABI45_0_0EXBarometerInterface, ABI45_0_0EXDeviceMotionInterface, ABI45_0_0EXGyroscopeInterface, ABI45_0_0EXMagnetometerInterface, ABI45_0_0EXMagnetometerUncalibratedInterface>

@end
