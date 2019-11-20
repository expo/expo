// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMAccelerometerInterface.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMBarometerInterface.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMDeviceMotionInterface.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMGyroscopeInterface.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMMagnetometerInterface.h>
#import <ABI35_0_0UMSensorsInterface/ABI35_0_0UMMagnetometerUncalibratedInterface.h>

static const float ABI35_0_0EXGravity = 9.81;

@interface ABI35_0_0EXSensorsManager : NSObject <ABI35_0_0UMInternalModule, ABI35_0_0UMAccelerometerInterface, ABI35_0_0UMBarometerInterface, ABI35_0_0UMDeviceMotionInterface, ABI35_0_0UMGyroscopeInterface, ABI35_0_0UMMagnetometerInterface, ABI35_0_0UMMagnetometerUncalibratedInterface>

@end
