#import <CoreMotion/CoreMotion.h>

#import "EXGyroscope.h"
#import "EXUnversioned.h"
#import "RCTEventEmitter.h"
#import "RCTEventDispatcher.h"

@interface EXGyroscope ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation EXGyroscope

+ (NSString *)moduleName { return @"ExponentGyroscope"; }


- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _paused = NO;
    _manager = [[CMMotionManager alloc] init];
    
    if ([_manager isGyroAvailable]) {
      [_manager setGyroUpdateInterval:0.1f];
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
  return @[@"gyroscopeDidUpdate"];
}

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [_manager setGyroUpdateInterval:intervalAsFractionOfSecond];
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
  if (![_manager isGyroActive] && [_manager isGyroAvailable]) {
    __weak typeof(self) weakSelf = self;
    [_manager startGyroUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMGyroData *data, NSError *error) {
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
