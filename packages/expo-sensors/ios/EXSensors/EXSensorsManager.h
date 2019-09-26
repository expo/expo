// Copyright 2015-present 650 Industries. All rights reserved.

#import <UMCore/UMInternalModule.h>
#import <UMSensorsInterface/UMAccelerometerInterface.h>
#import <UMSensorsInterface/UMBarometerInterface.h>
#import <UMSensorsInterface/UMDeviceMotionInterface.h>
#import <UMSensorsInterface/UMGyroscopeInterface.h>
#import <UMSensorsInterface/UMMagnetometerInterface.h>
#import <UMSensorsInterface/UMMagnetometerUncalibratedInterface.h>

static const float EXGravity = 9.81;

@interface EXSensorsManager : NSObject <UMInternalModule, UMAccelerometerInterface, UMBarometerInterface, UMDeviceMotionInterface, UMGyroscopeInterface, UMMagnetometerInterface, UMMagnetometerUncalibratedInterface>

@end
