#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import "ABI26_0_0EXScopedEventEmitter.h"

@protocol ABI26_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI26_0_0EXMagnetometerUncalibrated : ABI26_0_0EXScopedEventEmitter

@end
