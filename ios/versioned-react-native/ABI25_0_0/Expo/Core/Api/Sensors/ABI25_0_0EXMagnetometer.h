#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import "ABI25_0_0EXScopedEventEmitter.h"

@protocol ABI25_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI25_0_0EXMagnetometer : ABI25_0_0EXScopedEventEmitter

@end
