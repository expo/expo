// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMAccelerometerInterface.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMBarometerInterface.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMDeviceMotionInterface.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMGyroscopeInterface.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMMagnetometerInterface.h>
#import <ABI40_0_0UMSensorsInterface/ABI40_0_0UMMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI40_0_0EXGravity = 9.80665;

@interface ABI40_0_0EXSensorsManager : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0UMAccelerometerInterface, ABI40_0_0UMBarometerInterface, ABI40_0_0UMDeviceMotionInterface, ABI40_0_0UMGyroscopeInterface, ABI40_0_0UMMagnetometerInterface, ABI40_0_0UMMagnetometerUncalibratedInterface>

@end
