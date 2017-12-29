#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import "ABI23_0_0EXScopedEventEmitter.h"

@protocol ABI23_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI23_0_0EXMagnetometer : ABI23_0_0EXScopedEventEmitter

@end
