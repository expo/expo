// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAccelerometerInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXBarometerInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDeviceMotionInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXGyroscopeInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXMagnetometerInterface.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI46_0_0EXGravity = 9.80665;

@interface ABI46_0_0EXSensorsManager : NSObject <ABI46_0_0EXInternalModule, ABI46_0_0EXAccelerometerInterface, ABI46_0_0EXBarometerInterface, ABI46_0_0EXDeviceMotionInterface, ABI46_0_0EXGyroscopeInterface, ABI46_0_0EXMagnetometerInterface, ABI46_0_0EXMagnetometerUncalibratedInterface>

@end
