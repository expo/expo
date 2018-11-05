#import "ABI27_0_0EXGyroscope.h"
#import "ABI27_0_0EXUnversioned.h"
#import "ABI27_0_0EXScopedModuleRegistry.h"

@interface ABI27_0_0EXGyroscope ()

@property (nonatomic, weak) id kernelSensorServiceDelegate;
@property (nonatomic, assign, getter=isWatching) BOOL watching;

@end

@implementation ABI27_0_0EXGyroscope

ABI27_0_0EX_EXPORT_SCOPED_MODULE(ExponentGyroscope, SensorManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelSensorServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (void)setBridge:(ABI27_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _watching = NO;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:self.bridge];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"gyroscopeDidUpdate"];
}

- (void)startObserving {
  [self setWatching:YES];
  __weak typeof(self) weakSelf = self;
  [_kernelSensorServiceDelegate sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:self.experienceId withHandler:^(NSDictionary *event) {
    [weakSelf sendEventWithName:@"gyroscopeDidUpdate" body:event];
  }];
}

- (void)stopObserving {
  [self setWatching:NO];
  [_kernelSensorServiceDelegate sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:self.experienceId];
}

ABI27_0_0RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  [_kernelSensorServiceDelegate setGyroscopeUpdateInterval:[intervalMs doubleValue] / 1000];
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
    [_kernelSensorServiceDelegate sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:self.experienceId];
  }
}

@end
