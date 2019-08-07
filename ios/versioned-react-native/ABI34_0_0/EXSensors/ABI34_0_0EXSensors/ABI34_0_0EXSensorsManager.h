// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMAccelerometerInterface.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMBarometerInterface.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMDeviceMotionInterface.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMGyroscopeInterface.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMMagnetometerInterface.h>
#import <ABI34_0_0UMSensorsInterface/ABI34_0_0UMMagnetometerUncalibratedInterface.h>

static const float ABI34_0_0EXGravity = 9.81;

@interface ABI34_0_0EXSensorsManager : NSObject <ABI34_0_0UMInternalModule, ABI34_0_0UMAccelerometerInterface, ABI34_0_0UMBarometerInterface, ABI34_0_0UMDeviceMotionInterface, ABI34_0_0UMGyroscopeInterface, ABI34_0_0UMMagnetometerInterface, ABI34_0_0UMMagnetometerUncalibratedInterface>

@end
