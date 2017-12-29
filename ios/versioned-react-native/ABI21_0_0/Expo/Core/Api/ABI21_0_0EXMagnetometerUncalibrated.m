#import <CoreMotion/CoreMotion.h>

#import "ABI21_0_0EXMagnetometerUncalibrated.h"
#import "ABI21_0_0EXUnversioned.h"
#import <ReactABI21_0_0/ABI21_0_0RCTEventEmitter.h>
#import <ReactABI21_0_0/ABI21_0_0RCTEventDispatcher.h>

@interface ABI21_0_0EXMagnetometerUncalibrated ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation ABI21_0_0EXMagnetometerUncalibrated

ABI21_0_0RCT_EXPORT_MODULE(ExponentMagnetometerUncalibrated);

- (void)setBridge:(ABI21_0_0RCTBridge *)bridge

{
  [super setBridge:bridge];
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

- (CMMotionManager *)manager
{
  // TODO (brent): singleton
  if (!_manager) {
    _manager = [[CMMotionManager alloc] init];

    if ([_manager isMagnetometerAvailable]) {
      [_manager setMagnetometerUpdateInterval:0.1f];
    }
  }
  return _manager;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"magnetometerUncalibratedDidUpdate"];
}

ABI21_0_0RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [self.manager setMagnetometerUpdateInterval:intervalAsFractionOfSecond];
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
  if ([self.manager isMagnetometerActive]) {
    [self setPaused:YES];
  }

  [self stopObserving];
}

- (void)startObserving
{
  if (![self.manager isMagnetometerActive] && [self.manager isMagnetometerAvailable]) {
    __weak typeof(self) weakSelf = self;
    [self.manager startMagnetometerUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMMagnetometerData *data, NSError *error) {
      [weakSelf sendEventWithName:@"magnetometerUncalibratedDidUpdate" body:@{
                                                                   @"x": [NSNumber numberWithDouble:data.magneticField.x],
                                                                   @"y": [NSNumber numberWithDouble:data.magneticField.y],
                                                                   @"z": [NSNumber numberWithDouble:data.magneticField.z]
                                                                   }];
    }];
  }
}

- (void)stopObserving
{
  if ([self.manager isMagnetometerActive]) {
    [self.manager stopMagnetometerUpdates];
  }
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopObserving];
}

@end
