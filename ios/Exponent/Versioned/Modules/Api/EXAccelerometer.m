#import <CoreMotion/CoreMotion.h>

#import "EXAccelerometer.h"
#import "EXUnversioned.h"
#import "RCTEventEmitter.h"
#import "RCTEventDispatcher.h"

@interface EXAccelerometer ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation EXAccelerometer

RCT_EXPORT_MODULE(ExponentAccelerometer);

- (instancetype)init
{
  if (self = [super init]) {
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

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
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
  if ([self.manager isGyroActive]) {
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
