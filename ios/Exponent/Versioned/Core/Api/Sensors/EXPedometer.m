// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXPedometer.h"
#import "EXUnversioned.h"

#import <CoreMotion/CoreMotion.h>

NSString * const EXPedometerUpdateEventName = @"Exponent.pedometerUpdate";

@implementation EXPedometer
{
  CMPedometer *_pedometer;
  BOOL _isWatching;
  CMPedometerHandler _watchHandler;
  NSDate *_watchStartDate;
}

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _isWatching = NO;

  __weak typeof(self) weakSelf = self;
  _watchHandler = ^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    if (error) {
      // TODO: Handle errors
      return;
    }
    [weakSelf sendEventWithName:EXPedometerUpdateEventName
                           body:@{@"steps": pedometerData.numberOfSteps}];
  };

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidForegroundNotification")
                                             object:self.bridge];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:EX_UNVERSIONED(@"EXKernelBridgeDidBackgroundNotification")
                                             object:self.bridge];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_isWatching) {
    [_pedometer startPedometerUpdatesFromDate:_watchStartDate withHandler:_watchHandler];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  if (_isWatching) {
    [_pedometer stopPedometerUpdates];
  }
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [self stopWatchingStepCount];
}

RCT_EXPORT_MODULE(ExponentPedometer)

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXPedometerUpdateEventName];
}

RCT_EXPORT_METHOD(getStepCountAsync:(nonnull NSNumber *)startTime
                            endTime:(nonnull NSNumber *)endTime
                           resolver:(RCTPromiseResolveBlock)resolve
                           rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!_pedometer) {
    _pedometer = [CMPedometer new];
  }

  NSDate *startDate = [NSDate dateWithTimeIntervalSince1970:startTime.doubleValue / 1000];
  NSDate *endDate = [NSDate dateWithTimeIntervalSince1970:endTime.doubleValue / 1000];
  [_pedometer queryPedometerDataFromDate:startDate toDate:endDate withHandler:^(CMPedometerData * _Nullable pedometerData, NSError * _Nullable error) {
    if (error) {
      reject(@"E_PEDOMETER", @"An error occured while querying pedometer data.", error);
      return;
    }

    resolve(@{@"steps": pedometerData.numberOfSteps});
  }];
}

RCT_EXPORT_METHOD(watchStepCount)
{
  if (!_pedometer) {
    _pedometer = [CMPedometer new];
  }
  [_pedometer stopPedometerUpdates];

  _isWatching = YES;
  _watchStartDate = [NSDate date];
  [_pedometer startPedometerUpdatesFromDate:_watchStartDate withHandler:_watchHandler];
}

RCT_EXPORT_METHOD(stopWatchingStepCount)
{
  _watchStartDate = nil;
  _isWatching = NO;
  [_pedometer stopPedometerUpdates];
}

RCT_EXPORT_METHOD(isAvailableAsync:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@([CMPedometer isStepCountingAvailable]));
}

@end
