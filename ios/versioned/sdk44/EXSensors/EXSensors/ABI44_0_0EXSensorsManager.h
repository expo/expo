// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAccelerometerInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXBarometerInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDeviceMotionInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXGyroscopeInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXMagnetometerInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI44_0_0EXGravity = 9.80665;

@interface ABI44_0_0EXSensorsManager : NSObject <ABI44_0_0EXInternalModule, ABI44_0_0EXAccelerometerInterface, ABI44_0_0EXBarometerInterface, ABI44_0_0EXDeviceMotionInterface, ABI44_0_0EXGyroscopeInterface, ABI44_0_0EXMagnetometerInterface, ABI44_0_0EXMagnetometerUncalibratedInterface>

@end
