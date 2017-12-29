#import <CoreMotion/CoreMotion.h>
#import <React/RCTBridge.h>
#import "EXScopedEventEmitter.h"

@protocol EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface EXGyroscope : EXScopedEventEmitter

@end
