// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAccelerometer.h"
#import "EXDeviceMotion.h"
#import "EXGyroscope.h"
#import "EXMagnetometer.h"
#import "EXMagnetometerUncalibrated.h"

@interface EXSensorManager : NSObject <EXAccelerometerScopedModuleDelegate,
                                       EXDeviceMotionScopedModuleDelegate,
                                       EXGyroscopeScopedModuleDelegate,
                                       EXMagnetometerScopedModuleDelegate,
                                       EXMagnetometerUncalibratedScopedModuleDelegate>

@end
