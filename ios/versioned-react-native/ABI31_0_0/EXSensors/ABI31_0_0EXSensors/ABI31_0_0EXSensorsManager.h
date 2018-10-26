// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>
#import <ABI31_0_0EXSensorsInterface/ABI31_0_0EXAccelerometerInterface.h>
#import <ABI31_0_0EXSensorsInterface/ABI31_0_0EXDeviceMotionInterface.h>
#import <ABI31_0_0EXSensorsInterface/ABI31_0_0EXGyroscopeInterface.h>
#import <ABI31_0_0EXSensorsInterface/ABI31_0_0EXMagnetometerInterface.h>
#import <ABI31_0_0EXSensorsInterface/ABI31_0_0EXMagnetometerUncalibratedInterface.h>

static const float ABI31_0_0EXGravity = 9.81;

@interface ABI31_0_0EXSensorsManager : NSObject <ABI31_0_0EXInternalModule, ABI31_0_0EXAccelerometerInterface, ABI31_0_0EXDeviceMotionInterface, ABI31_0_0EXGyroscopeInterface, ABI31_0_0EXMagnetometerInterface, ABI31_0_0EXMagnetometerUncalibratedInterface>

@end
