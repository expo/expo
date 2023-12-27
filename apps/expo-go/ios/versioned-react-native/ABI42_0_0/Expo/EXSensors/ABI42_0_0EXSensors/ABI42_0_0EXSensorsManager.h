// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXAccelerometerInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXBarometerInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXDeviceMotionInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXGyroscopeInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXMagnetometerInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI42_0_0EXGravity = 9.80665;

@interface ABI42_0_0EXSensorsManager : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0EXAccelerometerInterface, ABI42_0_0EXBarometerInterface, ABI42_0_0EXDeviceMotionInterface, ABI42_0_0EXGyroscopeInterface, ABI42_0_0EXMagnetometerInterface, ABI42_0_0EXMagnetometerUncalibratedInterface>

@end
