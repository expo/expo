// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAccelerometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXBarometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDeviceMotionInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXGyroscopeInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXMagnetometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI47_0_0EXGravity = 9.80665;

@interface ABI47_0_0EXSensorsManager : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXAccelerometerInterface, ABI47_0_0EXBarometerInterface, ABI47_0_0EXDeviceMotionInterface, ABI47_0_0EXGyroscopeInterface, ABI47_0_0EXMagnetometerInterface, ABI47_0_0EXMagnetometerUncalibratedInterface>

@end
