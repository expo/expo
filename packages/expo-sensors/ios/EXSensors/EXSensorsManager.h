// Copyright 2015-present 650 Industries. All rights reserved.

#import <UMCore/UMInternalModule.h>
#import <UMSensorsInterface/UMAccelerometerInterface.h>
#import <UMSensorsInterface/UMBarometerInterface.h>
#import <UMSensorsInterface/UMDeviceMotionInterface.h>
#import <UMSensorsInterface/UMGyroscopeInterface.h>
#import <UMSensorsInterface/UMMagnetometerInterface.h>
#import <UMSensorsInterface/UMMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float EXGravity = 9.80665;

@interface EXSensorsManager : NSObject <UMInternalModule, UMAccelerometerInterface, UMBarometerInterface, UMDeviceMotionInterface, UMGyroscopeInterface, UMMagnetometerInterface, UMMagnetometerUncalibratedInterface>

@end
