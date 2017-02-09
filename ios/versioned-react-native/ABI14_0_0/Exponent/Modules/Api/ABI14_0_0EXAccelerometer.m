#import <CoreMotion/CoreMotion.h>

#import "ABI14_0_0EXAccelerometer.h"
#import "ABI14_0_0EXUnversioned.h"
#import <ReactABI14_0_0/ABI14_0_0RCTEventEmitter.h>
#import <ReactABI14_0_0/ABI14_0_0RCTEventDispatcher.h>

@interface ABI14_0_0EXAccelerometer ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation ABI14_0_0EXAccelerometer

ABI14_0_0RCT_EXPORT_MODULE(ExponentAccelerometer);

- (instancetype)init
{
  if (self = [super init]) {
    _paused = NO;
  
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidForeground:)
                                                 name:@"EXKernelBridgeDidForegroundNotification"
                                               object:self.bridge];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidBackground:)
                                                 name:@"EXKernelBridgeDidBackgroundNotification"
                                               object:self.bridge];
  }
  return self;
}

- (CMMotionManager *)manager
{
  // TODO (brent): singleton
  if (!_manager) {
    _manager = [[CMMotionManager alloc] init];
    
    if ([_manager isAccelerometerAvailable]) {
      [_manager setAccelerometerUpdateInterval:0.1f];
    }
  }
  return _manager;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"accelerometerDidUpdate"];
}

ABI14_0_0RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [self.manager setAccelerometerUpdateInterval:intervalAsFractionOfSecond];
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
  if ([self.manager isAccelerometerActive]) {
    [self setPaused:YES];
  }
  
  [self stopObserving];
}

- (void)startObserving
{
  if (![self.manager isAccelerometerActive] && [self.manager isAccelerometerAvailable]) {
    __weak typeof(self) weakSelf = self;
    [self.manager startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMAccelerometerData *data, NSError *error) {
      [weakSelf sendEventWithName:@"accelerometerDidUpdate" body:@{
                                                                   @"x": [NSNumber numberWithDouble:data.acceleration.x],
                                                                   @"y": [NSNumber numberWithDouble:data.acceleration.y],
                                                                   @"z": [NSNumber numberWithDouble:data.acceleration.z]
                                                                   }];
    }];
  }
}

- (void)stopObserving
{
  if ([self.manager isAccelerometerActive]) {
    [self.manager stopAccelerometerUpdates];
  }
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopObserving];
}

@end
