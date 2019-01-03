// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXSensorsInterface/ABI32_0_0EXAccelerometerInterface.h>
#import <ABI32_0_0EXSensorsInterface/ABI32_0_0EXDeviceMotionInterface.h>
#import <ABI32_0_0EXSensorsInterface/ABI32_0_0EXGyroscopeInterface.h>
#import <ABI32_0_0EXSensorsInterface/ABI32_0_0EXMagnetometerInterface.h>
#import <ABI32_0_0EXSensorsInterface/ABI32_0_0EXMagnetometerUncalibratedInterface.h>

static const float ABI32_0_0EXGravity = 9.81;

@interface ABI32_0_0EXSensorsManager : NSObject <ABI32_0_0EXInternalModule, ABI32_0_0EXAccelerometerInterface, ABI32_0_0EXDeviceMotionInterface, ABI32_0_0EXGyroscopeInterface, ABI32_0_0EXMagnetometerInterface, ABI32_0_0EXMagnetometerUncalibratedInterface>

@end
