// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXAccelerometerInterface.h>
#import <ExpoModulesCore/EXBarometerInterface.h>
#import <ExpoModulesCore/EXDeviceMotionInterface.h>
#import <ExpoModulesCore/EXGyroscopeInterface.h>
#import <ExpoModulesCore/EXMagnetometerInterface.h>
#import <ExpoModulesCore/EXMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float EXGravity = 9.80665;

@interface EXSensorsManager : NSObject <EXInternalModule, EXAccelerometerInterface, EXBarometerInterface, EXDeviceMotionInterface, EXGyroscopeInterface, EXMagnetometerInterface, EXMagnetometerUncalibratedInterface>

@end
