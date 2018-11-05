// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXSensorsInterface/ABI30_0_0EXAccelerometerInterface.h>
#import <ABI30_0_0EXSensorsInterface/ABI30_0_0EXDeviceMotionInterface.h>
#import <ABI30_0_0EXSensorsInterface/ABI30_0_0EXGyroscopeInterface.h>
#import <ABI30_0_0EXSensorsInterface/ABI30_0_0EXMagnetometerInterface.h>
#import <ABI30_0_0EXSensorsInterface/ABI30_0_0EXMagnetometerUncalibratedInterface.h>

static const float ABI30_0_0EXGravity = 9.81;

@interface ABI30_0_0EXSensorsManager : NSObject <ABI30_0_0EXInternalModule, ABI30_0_0EXAccelerometerInterface, ABI30_0_0EXDeviceMotionInterface, ABI30_0_0EXGyroscopeInterface, ABI30_0_0EXMagnetometerInterface, ABI30_0_0EXMagnetometerUncalibratedInterface>

@end
