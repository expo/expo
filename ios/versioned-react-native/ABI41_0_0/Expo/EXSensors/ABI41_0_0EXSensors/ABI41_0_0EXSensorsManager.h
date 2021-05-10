// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMAccelerometerInterface.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMBarometerInterface.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMDeviceMotionInterface.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMGyroscopeInterface.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMMagnetometerInterface.h>
#import <ABI41_0_0UMSensorsInterface/ABI41_0_0UMMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI41_0_0EXGravity = 9.80665;

@interface ABI41_0_0EXSensorsManager : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0UMAccelerometerInterface, ABI41_0_0UMBarometerInterface, ABI41_0_0UMDeviceMotionInterface, ABI41_0_0UMGyroscopeInterface, ABI41_0_0UMMagnetometerInterface, ABI41_0_0UMMagnetometerUncalibratedInterface>

@end
