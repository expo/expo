#import <CoreMotion/CoreMotion.h>

#import "EXMagnetometer.h"
#import "EXUnversioned.h"
#import <React/RCTEventEmitter.h>
#import <React/RCTEventDispatcher.h>

@interface EXMagnetometer ()

@property (nonatomic, strong) CMMotionManager *manager;
@property (nonatomic, assign, getter=isPaused) BOOL paused;

@end

@implementation EXMagnetometer

RCT_EXPORT_MODULE(ExponentMagnetometer);

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

    if ([_manager isDeviceMotionAvailable]) {
      [_manager setDeviceMotionUpdateInterval:0.1f];
    }
  }
  return _manager;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"magnetometerDidUpdate"];
}

RCT_EXPORT_METHOD(setUpdateInterval:(nonnull NSNumber *)intervalMs) {
  double intervalAsFractionOfSecond = [intervalMs doubleValue] / 1000;
  [self.manager setDeviceMotionUpdateInterval:intervalAsFractionOfSecond];
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
  if ([self.manager isDeviceMotionActive]) {
    [self setPaused:YES];
  }

  [self stopObserving];
}

- (void)startObserving
{
  if (![self.manager isDeviceMotionActive] && [self.manager isDeviceMotionAvailable]) {
    __weak typeof(self) weakSelf = self;
    [self.manager  
     startDeviceMotionUpdatesUsingReferenceFrame:CMAttitudeReferenceFrameXArbitraryCorrectedZVertical toQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion
 *data, NSError *error) {
      [weakSelf sendEventWithName:@"magnetometerDidUpdate" body:@{
                                                                   @"x": [NSNumber numberWithDouble:data.magneticField.field.x],
                                                                   @"y": [NSNumber numberWithDouble:data.magneticField.field.y],
                                                                   @"z": [NSNumber numberWithDouble:data.magneticField.field.z]
                                                                   }];
    }];
  }
}

- (void)stopObserving
{
  if ([self.manager isDeviceMotionActive]) {
    [self.manager stopDeviceMotionUpdates];
  }
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopObserving];
}

@end
