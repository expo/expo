#import <CoreMotion/CoreMotion.h>

#import "EXGyroscope.h"
#import "EXUnversioned.h"
#import <React/RCTEventEmitter.h>
#import <React/RCTEventDispatcher.h>

@interface EXGyroscope ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation EXGyroscope

RCT_EXPORT_MODULE(ExponentGyroscope);

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _paused = NO;
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (CMMotionManager *)manager
{
  // TODO (brent): singleton
  if (!_manager) {
    _manager = [[CMMotionManager alloc] init];
    
    if ([_manager isGyroAvailable]) {
      [_manager setGyroUpdateInterval:0.1f];
    }
  }
  return _manager;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"gyroscopeDidUpdate"];
}

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [self.manager setGyroUpdateInterval:intervalAsFractionOfSecond];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if ([self isPaused]) {
    [self setPaused:NO];
    [self startObserving];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if ([self.manager isGyroActive]) {
    [self setPaused:YES];
  }

  [self stopObserving];
}

- (void)startObserving
{
  if (![self.manager isGyroActive] && [self.manager isGyroAvailable]) {
    __weak typeof(self) weakSelf = self;
    [self.manager startGyroUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMGyroData *data, NSError *error) {
      [weakSelf sendEventWithName:@"gyroscopeDidUpdate" body:@{
                                                           @"x": [NSNumber numberWithDouble:data.rotationRate.x],
                                                           @"y": [NSNumber numberWithDouble:data.rotationRate.y],
                                                           @"z": [NSNumber numberWithDouble:data.rotationRate.z]
                                                           }];
    }];
  }
}

- (void)stopObserving
{
  if ([self.manager isGyroActive]) {
    [self.manager stopGyroUpdates];
  }
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopObserving];
}

@end
