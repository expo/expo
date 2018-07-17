// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXSensorsInterface/ABI29_0_0EXAccelerometerInterface.h>
#import <ABI29_0_0EXSensorsInterface/ABI29_0_0EXDeviceMotionInterface.h>
#import <ABI29_0_0EXSensorsInterface/ABI29_0_0EXGyroscopeInterface.h>
#import <ABI29_0_0EXSensorsInterface/ABI29_0_0EXMagnetometerInterface.h>
#import <ABI29_0_0EXSensorsInterface/ABI29_0_0EXMagnetometerUncalibratedInterface.h>

static const float ABI29_0_0EXGravity = 9.81;

@interface ABI29_0_0EXSensorsManager : NSObject <ABI29_0_0EXInternalModule, ABI29_0_0EXAccelerometerInterface, ABI29_0_0EXDeviceMotionInterface, ABI29_0_0EXGyroscopeInterface, ABI29_0_0EXMagnetometerInterface, ABI29_0_0EXMagnetometerUncalibratedInterface>

@end
