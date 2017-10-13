#import "EXAccelerometer.h"
#import "EXUnversioned.h"
#import "EXScopedModuleRegistry.h"

@interface EXAccelerometer ()

@property (nonatomic, weak) id kernelSensorServiceDelegate;
@property (nonatomic, assign, getter=isWatching) BOOL watching;

@end

@implementation EXAccelerometer

EX_EXPORT_SCOPED_MODULE(ExponentAccelerometer, SensorManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelSensorServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _watching = NO;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"accelerometerDidUpdate"];
}

- (void)startObserving {
  [self setWatching:YES];
  __weak typeof(self) weakSelf = self;
  [_kernelSensorServiceDelegate sensorModuleDidSubscribeForAccelerometerUpdates:self withHandler:^(NSDictionary *event) {
    [weakSelf sendEventWithName:@"accelerometerDidUpdate" body:event];
  }];
}

- (void)stopObserving {
  [self setWatching:NO];
  [_kernelSensorServiceDelegate sensorModuleDidUnsubscribeForAccelerometerUpdates:self];
}

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  [_kernelSensorServiceDelegate setAccelerometerUpdateInterval:[intervalMs doubleValue] / 1000];

}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if ([self isWatching]) {
    [self startObserving];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if ([self isWatching]) {
    [_kernelSensorServiceDelegate sensorModuleDidUnsubscribeForAccelerometerUpdates:self];
  }
}

@end
