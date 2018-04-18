#import <CoreMotion/CoreMotion.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import "ABI27_0_0EXScopedEventEmitter.h"

@protocol ABI27_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI27_0_0EXGyroscope : ABI27_0_0EXScopedEventEmitter

@end
