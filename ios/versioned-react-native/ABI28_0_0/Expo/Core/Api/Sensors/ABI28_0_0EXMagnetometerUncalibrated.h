#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>
#import "ABI28_0_0EXScopedEventEmitter.h"

@protocol ABI28_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI28_0_0EXMagnetometerUncalibrated : ABI28_0_0EXScopedEventEmitter

@end
