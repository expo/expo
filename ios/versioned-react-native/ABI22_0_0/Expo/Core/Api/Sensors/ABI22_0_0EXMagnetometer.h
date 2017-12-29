#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#import "ABI22_0_0EXScopedEventEmitter.h"

@protocol ABI22_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI22_0_0EXMagnetometer : ABI22_0_0EXScopedEventEmitter

@end
