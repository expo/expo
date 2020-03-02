// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMAccelerometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMBarometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMDeviceMotionInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMGyroscopeInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMMagnetometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMMagnetometerUncalibratedInterface.h>

static const float ABI37_0_0EXGravity = 9.81;

@interface ABI37_0_0EXSensorsManager : NSObject <ABI37_0_0UMInternalModule, ABI37_0_0UMAccelerometerInterface, ABI37_0_0UMBarometerInterface, ABI37_0_0UMDeviceMotionInterface, ABI37_0_0UMGyroscopeInterface, ABI37_0_0UMMagnetometerInterface, ABI37_0_0UMMagnetometerUncalibratedInterface>

@end
