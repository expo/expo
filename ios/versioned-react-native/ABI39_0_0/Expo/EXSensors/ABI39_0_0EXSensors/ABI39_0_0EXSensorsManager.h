// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMAccelerometerInterface.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMBarometerInterface.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMDeviceMotionInterface.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMGyroscopeInterface.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMMagnetometerInterface.h>
#import <ABI39_0_0UMSensorsInterface/ABI39_0_0UMMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI39_0_0EXGravity = 9.80665;

@interface ABI39_0_0EXSensorsManager : NSObject <ABI39_0_0UMInternalModule, ABI39_0_0UMAccelerometerInterface, ABI39_0_0UMBarometerInterface, ABI39_0_0UMDeviceMotionInterface, ABI39_0_0UMGyroscopeInterface, ABI39_0_0UMMagnetometerInterface, ABI39_0_0UMMagnetometerUncalibratedInterface>

@end
