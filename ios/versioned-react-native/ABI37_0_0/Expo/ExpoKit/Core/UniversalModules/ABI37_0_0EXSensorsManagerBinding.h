// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMAccelerometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMBarometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMDeviceMotionInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMGyroscopeInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMMagnetometerInterface.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMMagnetometerUncalibratedInterface.h>

@protocol ABI37_0_0EXSensorsManagerBindingDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

- (float)getGravity;
- (void)sensorModuleDidSubscribeForDeviceMotionUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdatesOfExperience:(NSString *)experienceId;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:(NSString *)experienceId;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

- (void)sensorModuleDidSubscribeForBarometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForBarometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setBarometerUpdateInterval:(NSTimeInterval)intervalMs;

- (BOOL)isBarometerAvailable;
- (BOOL)isAccelerometerAvailable;
- (BOOL)isDeviceMotionAvailable;
- (BOOL)isGyroAvailable;
- (BOOL)isMagnetometerAvailable;
- (BOOL)isMagnetometerUncalibratedAvailable;

@end

@interface ABI37_0_0EXSensorsManagerBinding : NSObject <ABI37_0_0UMInternalModule, ABI37_0_0UMAccelerometerInterface, ABI37_0_0UMBarometerInterface, ABI37_0_0UMDeviceMotionInterface, ABI37_0_0UMGyroscopeInterface, ABI37_0_0UMMagnetometerInterface, ABI37_0_0UMMagnetometerUncalibratedInterface>

- (instancetype)initWithExperienceId:(NSString *)experienceId andKernelService:(id<ABI37_0_0EXSensorsManagerBindingDelegate>)kernelService;

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
