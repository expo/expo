// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXAccelerometerInterface.h>
#import <ExpoModulesCore/EXBarometerInterface.h>
#import <ExpoModulesCore/EXDeviceMotionInterface.h>
#import <ExpoModulesCore/EXGyroscopeInterface.h>
#import <ExpoModulesCore/EXMagnetometerInterface.h>
#import <ExpoModulesCore/EXMagnetometerUncalibratedInterface.h>

@protocol EXSensorsManagerBindingDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdatesOfExperience:(NSString *)scopeKey withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdatesOfExperience:(NSString *)scopeKey;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

- (float)getGravity;
- (void)sensorModuleDidSubscribeForDeviceMotionUpdatesOfExperience:(NSString *)scopeKey withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdatesOfExperience:(NSString *)scopeKey;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:(NSString *)scopeKey withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:(NSString *)scopeKey;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:(NSString *)scopeKey withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:(NSString *)scopeKey;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)scopeKey
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)scopeKey;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForBarometerUpdatesOfExperience:(NSString *)scopeKey withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForBarometerUpdatesOfExperience:(NSString *)scopeKey;
- (void)setBarometerUpdateInterval:(NSTimeInterval)intervalMs;

- (BOOL)isBarometerAvailable;
- (BOOL)isAccelerometerAvailable;
- (BOOL)isDeviceMotionAvailable;
- (BOOL)isGyroAvailable;
- (BOOL)isMagnetometerAvailable;
- (BOOL)isMagnetometerUncalibratedAvailable;

@end

@interface EXSensorsManagerBinding : NSObject <EXInternalModule, EXAccelerometerInterface, EXBarometerInterface, EXDeviceMotionInterface, EXGyroscopeInterface, EXMagnetometerInterface, EXMagnetometerUncalibratedInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey andKernelService:(id<EXSensorsManagerBindingDelegate>)kernelService;

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidSubscribeForBarometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)sensorModuleDidUnsubscribeForBarometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;
- (void)setBarometerUpdateInterval:(NSTimeInterval)intervalMs;

- (BOOL)isBarometerAvailable;

- (BOOL)isAccelerometerAvailable;
- (BOOL)isDeviceMotionAvailable;
- (BOOL)isGyroAvailable;
- (BOOL)isMagnetometerAvailable;
- (BOOL)isMagnetometerUncalibratedAvailable;

@end
