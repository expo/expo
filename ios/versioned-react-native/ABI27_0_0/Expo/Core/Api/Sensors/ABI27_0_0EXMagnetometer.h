#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import "ABI27_0_0EXScopedEventEmitter.h"

@protocol ABI27_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI27_0_0EXMagnetometer : ABI27_0_0EXScopedEventEmitter

@end
