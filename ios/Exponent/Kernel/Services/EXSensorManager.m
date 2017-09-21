// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelReactAppManager.h"
#import "EXSensorManager.h"
#import <CoreMotion/CoreMotion.h>

@interface EXSensorManager ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, strong) NSMutableDictionary *accelerometerHandlers;
@property (nonatomic, strong) NSMutableDictionary *deviceMotionHandlers;
@property (nonatomic, strong) NSMutableDictionary *gyroscopeHandlers;
@property (nonatomic, strong) NSMutableDictionary *magnetometerHandlers;
@property (nonatomic, strong) NSMutableDictionary *magnetometerUncalibratedHandlers;

@end

@implementation EXSensorManager

- (instancetype)init
{
  if (self = [super init]) {
    _accelerometerHandlers = [[NSMutableDictionary alloc] init];
    _deviceMotionHandlers = [[NSMutableDictionary alloc] init];
    _gyroscopeHandlers = [[NSMutableDictionary alloc] init];
    _magnetometerHandlers = [[NSMutableDictionary alloc] init];
    _magnetometerUncalibratedHandlers = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (CMMotionManager *)manager
{
  if (!_manager) {
    _manager = [[CMMotionManager alloc] init];
  }
  return _manager;
}

- (void)dealloc
{
  [self.manager stopAccelerometerUpdates];
  [self.manager stopDeviceMotionUpdates];
  [self.manager stopGyroUpdates];
  [self.manager stopMagnetometerUpdates];
}

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule
                                            withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  if ([self.manager isAccelerometerAvailable]) {
    self.accelerometerHandlers[((EXScopedEventEmitter *)scopedSensorModule).experienceId] = handlerBlock;
  }
  if (![self.manager isAccelerometerActive]) {
    [self.manager setAccelerometerUpdateInterval:0.1f];
    [self.manager startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMAccelerometerData *data, NSError *error) {
      for (void (^handler)(NSDictionary *) in self.accelerometerHandlers.allValues) {
        handler(@{
                  @"x": [NSNumber numberWithDouble:data.acceleration.x],
                  @"y": [NSNumber numberWithDouble:data.acceleration.y],
                  @"z": [NSNumber numberWithDouble:data.acceleration.z]
                  });
      }
    }];
  }
}

- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule
{
  [self.accelerometerHandlers removeObjectForKey:((EXScopedEventEmitter *)scopedSensorModule).experienceId];
  if (self.accelerometerHandlers.count == 0) {
    [self.manager stopAccelerometerUpdates];
  }
}

- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs
{
  [self.manager setAccelerometerUpdateInterval:intervalMs];
}

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule
                                           withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  if ([self.manager isDeviceMotionAvailable]) {
    self.deviceMotionHandlers[((EXScopedEventEmitter *)scopedSensorModule).experienceId] = handlerBlock;
  }
  if (![self.manager isDeviceMotionActive]) {
    [self activateDeviceMotionUpdates];
  }
}

- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule
{
  [self.deviceMotionHandlers removeObjectForKey:((EXScopedEventEmitter *)scopedSensorModule).experienceId];
  if (self.deviceMotionHandlers.count == 0 && self.magnetometerHandlers.count == 0) {
    [self.manager stopDeviceMotionUpdates];
  }
}

- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs
{
  [self.manager setDeviceMotionUpdateInterval:intervalMs];
}

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule
                                        withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  if ([self.manager isGyroAvailable]) {
    self.gyroscopeHandlers[((EXScopedEventEmitter *)scopedSensorModule).experienceId] = handlerBlock;
  }
  if (![self.manager isGyroActive]) {
    [self.manager setGyroUpdateInterval:0.1f];
    [self.manager startGyroUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMGyroData *data, NSError *error) {
      for (void (^handler)(NSDictionary *) in self.gyroscopeHandlers.allValues) {
        handler(@{
                  @"x": [NSNumber numberWithDouble:data.rotationRate.x],
                  @"y": [NSNumber numberWithDouble:data.rotationRate.y],
                  @"z": [NSNumber numberWithDouble:data.rotationRate.z]
                  });
      }
    }];
  }
}

- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule
{
  [self.gyroscopeHandlers removeObjectForKey:((EXScopedEventEmitter *)scopedSensorModule).experienceId];
  if (self.gyroscopeHandlers.count == 0) {
    [self.manager stopGyroUpdates];
  }
}

- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs
{
  [self.manager setGyroUpdateInterval:intervalMs];
}

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule
                                           withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  if ([self.manager isDeviceMotionAvailable]) {
    self.magnetometerHandlers[((EXScopedEventEmitter *)scopedSensorModule).experienceId] = handlerBlock;
  }
  if (![self.manager isDeviceMotionActive]) {
    [self activateDeviceMotionUpdates];
  }
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule
{
  [self.magnetometerHandlers removeObjectForKey:((EXScopedEventEmitter *)scopedSensorModule).experienceId];
  if (self.deviceMotionHandlers.count == 0 && self.magnetometerHandlers.count == 0) {
    [self.manager stopDeviceMotionUpdates];
  }
}

- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs
{
  [self.manager setMagnetometerUpdateInterval:intervalMs];
}

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  if ([self.manager isMagnetometerAvailable]) {
    self.magnetometerUncalibratedHandlers[((EXScopedEventEmitter *)scopedSensorModule).experienceId] = handlerBlock;
  }
  if (![self.manager isMagnetometerActive]) {
    [self.manager setMagnetometerUpdateInterval:0.1f];
    [self.manager startMagnetometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMMagnetometerData *data, NSError *error) {
      for (void (^handler)(NSDictionary *) in self.magnetometerUncalibratedHandlers.allValues) {
        handler(@{
                  @"x": [NSNumber numberWithDouble:data.magneticField.x],
                  @"y": [NSNumber numberWithDouble:data.magneticField.y],
                  @"z": [NSNumber numberWithDouble:data.magneticField.z]
                  });
      }
    }];
  }
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
{
  [self.magnetometerUncalibratedHandlers removeObjectForKey:((EXScopedEventEmitter *)scopedSensorModule).experienceId];
  if (self.magnetometerUncalibratedHandlers.count == 0) {
    [self.manager stopMagnetometerUpdates];
  }
}

- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs
{
  [self.manager setMagnetometerUpdateInterval:intervalMs];
}

- (void)activateDeviceMotionUpdates
{
  [self.manager setDeviceMotionUpdateInterval:0.1f];
  [self.manager
   startDeviceMotionUpdatesUsingReferenceFrame:CMAttitudeReferenceFrameXArbitraryCorrectedZVertical
   toQueue:[NSOperationQueue mainQueue]
   withHandler:^(CMDeviceMotion *data, NSError *error) {
     UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
     int orientationDegrees;
     switch (orientation) {
       case UIDeviceOrientationPortrait:
         orientationDegrees = 0;
         break;
       case UIDeviceOrientationLandscapeLeft:
         orientationDegrees = -90;
         break;
       case UIDeviceOrientationLandscapeRight:
         orientationDegrees = 90;
         break;
       case UIDeviceOrientationPortraitUpsideDown:
         orientationDegrees = 180;
         break;
       default:
         orientationDegrees = 0;
         break;
     }
     
     NSDictionary *result = @{
                              @"acceleration": @{
                                  @"x": @(data.userAcceleration.x * EXGravity),
                                  @"y": @(data.userAcceleration.y * EXGravity),
                                  @"z": @(data.userAcceleration.z * EXGravity)
                                  },
                              @"accelerationIncludingGravity": @{
                                  @"x": @((data.userAcceleration.x + data.gravity.x) * EXGravity),
                                  @"y": @((data.userAcceleration.y + data.gravity.y) * EXGravity),
                                  @"z": @((data.userAcceleration.z + data.gravity.z) * EXGravity)
                                  },
                              @"rotation": @{
                                  @"alpha": @(data.attitude.yaw),
                                  @"beta": @(data.attitude.pitch),
                                  @"gamma": @(data.attitude.roll),
                                  },
                              @"rotationRate" :@{
                                  @"alpha": @(data.rotationRate.z),
                                  @"beta": @(data.rotationRate.y),
                                  @"gamma": @(data.rotationRate.x)
                                  },
                              @"orientation": @(orientationDegrees)
                              };
     
     // DeviceMotionUpdates handle DeviceMotion data as well as magnetic field
     for (void (^handler)(NSDictionary *) in self.deviceMotionHandlers.allValues) {
       handler(result);
     }
     
     for (void (^handler)(NSDictionary *) in self.magnetometerHandlers.allValues) {
       handler(@{
                 @"x": [NSNumber numberWithDouble:data.magneticField.field.x],
                 @"y": [NSNumber numberWithDouble:data.magneticField.field.y],
                 @"z": [NSNumber numberWithDouble:data.magneticField.field.z]
                 });
     }
   }];
}

@end
