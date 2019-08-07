// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMAccelerometerInterface.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMBarometerInterface.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMDeviceMotionInterface.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMGyroscopeInterface.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMMagnetometerInterface.h>
#import <ABI33_0_0UMSensorsInterface/ABI33_0_0UMMagnetometerUncalibratedInterface.h>

static const float ABI33_0_0EXGravity = 9.81;

@interface ABI33_0_0EXSensorsManager : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMAccelerometerInterface, ABI33_0_0UMBarometerInterface, ABI33_0_0UMDeviceMotionInterface, ABI33_0_0UMGyroscopeInterface, ABI33_0_0UMMagnetometerInterface, ABI33_0_0UMMagnetometerUncalibratedInterface>

@end
