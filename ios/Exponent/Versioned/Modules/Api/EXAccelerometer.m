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

+ (NSString *)moduleName { return @"ExponentAccelerometer"; }


- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _paused = NO;
    _manager = [[CMMotionManager alloc] init];
    
    if ([_manager isAccelerometerAvailable]) {
      [_manager setAccelerometerUpdateInterval:0.1f];
    }
  }
  
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
  
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"accelerometerDidUpdate"];
}

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [_manager setAccelerometerUpdateInterval:intervalAsFractionOfSecond];
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
  if ([_manager isGyroActive]) {
    [self setPaused:YES];
  }
  
  [self stopObserving];
}

- (void)startObserving
{
  if (![_manager isAccelerometerActive] && [_manager isAccelerometerAvailable]) {
    __weak typeof(self) weakSelf = self;
    [_manager startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMAccelerometerData *data, NSError *error) {
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
  if ([_manager isGyroActive]) {
    [_manager stopGyroUpdates];
  }
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopObserving];
}

@end
