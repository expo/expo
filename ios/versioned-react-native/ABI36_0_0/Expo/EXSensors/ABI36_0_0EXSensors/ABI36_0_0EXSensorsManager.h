// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMAccelerometerInterface.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMBarometerInterface.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMDeviceMotionInterface.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMGyroscopeInterface.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMMagnetometerInterface.h>
#import <ABI36_0_0UMSensorsInterface/ABI36_0_0UMMagnetometerUncalibratedInterface.h>

static const float ABI36_0_0EXGravity = 9.81;

@interface ABI36_0_0EXSensorsManager : NSObject <ABI36_0_0UMInternalModule, ABI36_0_0UMAccelerometerInterface, ABI36_0_0UMBarometerInterface, ABI36_0_0UMDeviceMotionInterface, ABI36_0_0UMGyroscopeInterface, ABI36_0_0UMMagnetometerInterface, ABI36_0_0UMMagnetometerUncalibratedInterface>

@end
