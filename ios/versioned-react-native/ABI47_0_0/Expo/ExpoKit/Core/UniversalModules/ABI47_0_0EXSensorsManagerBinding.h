// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAccelerometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXBarometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDeviceMotionInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXGyroscopeInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXMagnetometerInterface.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXMagnetometerUncalibratedInterface.h>

@protocol ABI47_0_0EXSensorsManagerBindingDelegate

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

@interface ABI47_0_0EXSensorsManagerBinding : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXAccelerometerInterface, ABI47_0_0EXBarometerInterface, ABI47_0_0EXDeviceMotionInterface, ABI47_0_0EXGyroscopeInterface, ABI47_0_0EXMagnetometerInterface, ABI47_0_0EXMagnetometerUncalibratedInterface>

- (instancetype)initWithScopeKey:(NSString *)scopeKey andKernelService:(id<ABI47_0_0EXSensorsManagerBindingDelegate>)kernelService;

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
