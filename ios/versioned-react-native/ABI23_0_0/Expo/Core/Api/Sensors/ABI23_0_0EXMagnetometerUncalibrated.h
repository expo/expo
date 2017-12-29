#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import "ABI23_0_0EXScopedEventEmitter.h"

@protocol ABI23_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI23_0_0EXMagnetometerUncalibrated : ABI23_0_0EXScopedEventEmitter

@end
