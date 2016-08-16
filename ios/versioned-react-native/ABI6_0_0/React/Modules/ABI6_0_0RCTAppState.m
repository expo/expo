/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTAppState.h"

#import "ABI6_0_0RCTAssert.h"
#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTEventDispatcher.h"
#import "ABI6_0_0RCTUtils.h"

static NSString *ABI6_0_0RCTCurrentAppBackgroundState()
{
  static NSDictionary *states;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    states = @{
      @(UIApplicationStateActive): @"active",
      @(UIApplicationStateBackground): @"background"
    };
  });

  if (ABI6_0_0RCTRunningInAppExtension()) {
    return @"extension";
  }

  return states[@(ABI6_0_0RCTSharedApplication().applicationState)] ?: @"unknown";
}

@implementation ABI6_0_0RCTAppState
{
  NSString *_lastKnownState;
}

@synthesize bridge = _bridge;

ABI6_0_0RCT_EXPORT_MODULE()

#pragma mark - Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {

    // Needs to be called on the main thread, as it accesses UIApplication
    _lastKnownState = ABI6_0_0RCTCurrentAppBackgroundState();
  }
  return self;
}

- (void)setBridge:(ABI6_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                           UIApplicationDidEnterBackgroundNotification,
                           UIApplicationDidFinishLaunchingNotification,
                           UIApplicationWillResignActiveNotification,
                           UIApplicationWillEnterForegroundNotification]) {

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleAppStateDidChange:)
                                                 name:name
                                               object:nil];
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleMemoryWarning)
                                               name:UIApplicationDidReceiveMemoryWarningNotification
                                             object:nil];
}

- (void)handleMemoryWarning
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"memoryWarning"
                                              body:nil];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App Notification Methods

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  NSString *newState;

  if ([notification.name isEqualToString:UIApplicationWillResignActiveNotification]) {
    newState = @"inactive";
  } else if ([notification.name isEqualToString:UIApplicationWillEnterForegroundNotification]) {
    newState = @"background";
  } else {
    newState = ABI6_0_0RCTCurrentAppBackgroundState();
  }

  if (![newState isEqualToString:_lastKnownState]) {
    _lastKnownState = newState;
    [_bridge.eventDispatcher sendDeviceEventWithName:@"appStateDidChange"
                                                body:@{@"app_state": _lastKnownState}];
  }
}

#pragma mark - Public API

/**
 * Get the current background/foreground state of the app
 */
ABI6_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI6_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI6_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
