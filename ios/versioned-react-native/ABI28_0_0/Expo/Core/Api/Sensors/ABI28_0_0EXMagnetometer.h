#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import "ABI28_0_0EXScopedEventEmitter.h"

@protocol ABI28_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI28_0_0EXMagnetometer : ABI28_0_0EXScopedEventEmitter

@end
