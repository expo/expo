#import <CoreMotion/CoreMotion.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import "ABI26_0_0EXScopedEventEmitter.h"

@protocol ABI26_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:(NSString *)experienceId;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI26_0_0EXGyroscope : ABI26_0_0EXScopedEventEmitter

@end
