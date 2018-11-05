#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import "ABI27_0_0EXScopedEventEmitter.h"

@protocol ABI27_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:(NSString *)experienceId;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI27_0_0EXMagnetometerUncalibrated : ABI27_0_0EXScopedEventEmitter

@end
