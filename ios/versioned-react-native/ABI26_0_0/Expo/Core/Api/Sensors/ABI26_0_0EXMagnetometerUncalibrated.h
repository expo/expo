#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import "ABI26_0_0EXScopedEventEmitter.h"

@protocol ABI26_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI26_0_0EXMagnetometerUncalibrated : ABI26_0_0EXScopedEventEmitter

@end
