// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMAccelerometerInterface.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMBarometerInterface.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMDeviceMotionInterface.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMGyroscopeInterface.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMMagnetometerInterface.h>
#import <ABI38_0_0UMSensorsInterface/ABI38_0_0UMMagnetometerUncalibratedInterface.h>

// Gravity on the planet this module supports (currently just Earth) represented as m/s^2.
static const float ABI38_0_0EXGravity = 9.80665;

@interface ABI38_0_0EXSensorsManager : NSObject <ABI38_0_0UMInternalModule, ABI38_0_0UMAccelerometerInterface, ABI38_0_0UMBarometerInterface, ABI38_0_0UMDeviceMotionInterface, ABI38_0_0UMGyroscopeInterface, ABI38_0_0UMMagnetometerInterface, ABI38_0_0UMMagnetometerUncalibratedInterface>

@end
