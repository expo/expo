#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import "ABI25_0_0EXScopedEventEmitter.h"

@protocol ABI25_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI25_0_0EXMagnetometerUncalibrated : ABI25_0_0EXScopedEventEmitter

@end
