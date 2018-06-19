#import <CoreMotion/CoreMotion.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import "ABI27_0_0EXScopedEventEmitter.h"

@protocol ABI27_0_0EXAccelerometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI27_0_0EXAccelerometer : ABI27_0_0EXScopedEventEmitter

@end
