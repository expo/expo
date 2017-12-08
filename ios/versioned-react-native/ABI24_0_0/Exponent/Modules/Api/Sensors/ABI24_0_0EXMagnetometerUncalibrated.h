#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import "ABI24_0_0EXScopedEventEmitter.h"

@protocol ABI24_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI24_0_0EXMagnetometerUncalibrated : ABI24_0_0EXScopedEventEmitter

@end
