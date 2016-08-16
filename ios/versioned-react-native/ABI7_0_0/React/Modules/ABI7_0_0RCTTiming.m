/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTTiming.h"

#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTBridge+Private.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTUtils.h"

@interface ABI7_0_0RCTTimer : NSObject

@property (nonatomic, strong, readonly) NSDate *target;
@property (nonatomic, assign, readonly) BOOL repeats;
@property (nonatomic, copy, readonly) NSNumber *callbackID;
@property (nonatomic, assign, readonly) NSTimeInterval interval;

@end

@implementation ABI7_0_0RCTTimer

- (instancetype)initWithCallbackID:(NSNumber *)callbackID
                          interval:(NSTimeInterval)interval
                        targetTime:(NSTimeInterval)targetTime
                           repeats:(BOOL)repeats
{
  if ((self = [super init])) {
    _interval = interval;
    _repeats = repeats;
    _callbackID = callbackID;
    _target = [NSDate dateWithTimeIntervalSinceNow:targetTime];
  }
  return self;
}

/**
 * Returns `YES` if we should invoke the JS callback.
 */
- (BOOL)updateFoundNeedsJSUpdate
{
  if (_target && _target.timeIntervalSinceNow <= 0) {
    // The JS Timers will do fine grained calculating of expired timeouts.
    _target = _repeats ? [NSDate dateWithTimeIntervalSinceNow:_interval] : nil;
    return YES;
  }
  return NO;
}

@end

@implementation ABI7_0_0RCTTiming
{
  NSMutableDictionary<NSNumber *, ABI7_0_0RCTTimer *> *_timers;
}

@synthesize bridge = _bridge;
@synthesize paused = _paused;
@synthesize pauseCallback = _pauseCallback;

ABI7_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _paused = YES;
    _timers = [NSMutableDictionary new];

    for (NSString *name in @[UIApplicationWillResignActiveNotification,
                             UIApplicationDidEnterBackgroundNotification,
                             UIApplicationWillTerminateNotification]) {

      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(stopTimers)
                                                   name:name
                                                 object:nil];
    }

    for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                             UIApplicationWillEnterForegroundNotification]) {

      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(startTimers)
                                                   name:name
                                                 object:nil];
    }
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  return ABI7_0_0RCTJSThread;
}

- (void)invalidate
{
  [self stopTimers];
  _bridge = nil;
}

- (void)stopTimers
{
  self.paused = YES;
}

- (void)startTimers
{
  if (!_bridge || _timers.count == 0) {
    return;
  }

  self.paused = NO;
}

- (void)setPaused:(BOOL)paused
{
  if (_paused != paused) {
    _paused = paused;
    if (_pauseCallback) {
      _pauseCallback();
    }
  }
}

- (void)didUpdateFrame:(__unused ABI7_0_0RCTFrameUpdate *)update
{
  NSMutableArray<NSNumber *> *timersToCall = [NSMutableArray new];
  for (ABI7_0_0RCTTimer *timer in _timers.allValues) {
    if ([timer updateFoundNeedsJSUpdate]) {
      [timersToCall addObject:timer.callbackID];
    }
    if (!timer.target) {
      [_timers removeObjectForKey:timer.callbackID];
    }
  }

  // call timers that need to be called
  if (timersToCall.count > 0) {
    [_bridge enqueueJSCall:@"JSTimersExecution.callTimers" args:@[timersToCall]];
  }

  if (_timers.count == 0) {
    [self stopTimers];
  }
}

/**
 * There's a small difference between the time when we call
 * setTimeout/setInterval/requestAnimation frame and the time it actually makes
 * it here. This is important and needs to be taken into account when
 * calculating the timer's target time. We calculate this by passing in
 * Date.now() from JS and then subtracting that from the current time here.
 */
ABI7_0_0RCT_EXPORT_METHOD(createTimer:(nonnull NSNumber *)callbackID
                  duration:(NSTimeInterval)jsDuration
                  jsSchedulingTime:(NSDate *)jsSchedulingTime
                  repeats:(BOOL)repeats)
{
  if (jsDuration == 0 && repeats == NO) {
    // For super fast, one-off timers, just enqueue them immediately rather than waiting a frame.
    [_bridge _immediatelyCallTimer:callbackID];
    return;
  }

  NSTimeInterval jsSchedulingOverhead = MAX(-jsSchedulingTime.timeIntervalSinceNow, 0);

  NSTimeInterval targetTime = jsDuration - jsSchedulingOverhead;
  if (jsDuration < 0.018) { // Make sure short intervals run each frame
    jsDuration = 0;
  }

  ABI7_0_0RCTTimer *timer = [[ABI7_0_0RCTTimer alloc] initWithCallbackID:callbackID
                                                interval:jsDuration
                                              targetTime:targetTime
                                                 repeats:repeats];
  _timers[callbackID] = timer;
  [self startTimers];
}

ABI7_0_0RCT_EXPORT_METHOD(deleteTimer:(nonnull NSNumber *)timerID)
{
  [_timers removeObjectForKey:timerID];
  if (_timers.count == 0) {
    [self stopTimers];
  }
}

@end
