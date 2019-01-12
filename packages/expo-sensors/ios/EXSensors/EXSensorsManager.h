// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXCore/EXInternalModule.h>
#import <EXSensorsInterface/EXAccelerometerInterface.h>
#import <EXSensorsInterface/EXDeviceMotionInterface.h>
#import <EXSensorsInterface/EXGyroscopeInterface.h>
#import <EXSensorsInterface/EXMagnetometerInterface.h>
#import <EXSensorsInterface/EXMagnetometerUncalibratedInterface.h>

static const float EXGravity = 9.81;

@interface EXSensorsManager : NSObject <EXInternalModule, EXAccelerometerInterface, EXDeviceMotionInterface, EXGyroscopeInterface, EXMagnetometerInterface, EXMagnetometerUncalibratedInterface>

@end
