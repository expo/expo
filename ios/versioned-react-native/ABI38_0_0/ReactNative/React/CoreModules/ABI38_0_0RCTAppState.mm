/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTAppState.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTAssert.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTUtils.h>

#import "ABI38_0_0CoreModulesPlugins.h"

static NSString *ABI38_0_0RCTCurrentAppState()
{
  static NSDictionary *states;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    states = @{
      @(UIApplicationStateActive): @"active",
      @(UIApplicationStateBackground): @"background"
    };
  });

  if (ABI38_0_0RCTRunningInAppExtension()) {
    return @"extension";
  }

  return states[@(ABI38_0_0RCTSharedApplication().applicationState)] ?: @"unknown";
}

@interface ABI38_0_0RCTAppState() <NativeAppStateSpec>
@end

@implementation ABI38_0_0RCTAppState
{
  NSString *_lastKnownState;
}

ABI38_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (ABI38_0_0facebook::ABI38_0_0React::ModuleConstants<JS::NativeAppState::Constants>)constantsToExport
{
  return (ABI38_0_0facebook::ABI38_0_0React::ModuleConstants<JS::NativeAppState::Constants>)[self getConstants];
}

- (ABI38_0_0facebook::ABI38_0_0React::ModuleConstants<JS::NativeAppState::Constants>)getConstants
{
  return ABI38_0_0facebook::ABI38_0_0React::typedConstants<JS::NativeAppState::Constants>({
    .initialAppState = ABI38_0_0RCTCurrentAppState(),
  });
}

#pragma mark - Lifecycle

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"appStateDidChange", @"memoryWarning"];
}

- (void)startObserving
{
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

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App Notification Methods

- (void)handleMemoryWarning
{
  [self sendEventWithName:@"memoryWarning" body:nil];
}

- (void)handleAppStateDidChange:(NSNotification *)notification
{
  NSString *newState;

  if ([notification.name isEqualToString:UIApplicationWillResignActiveNotification]) {
    newState = @"inactive";
  } else if ([notification.name isEqualToString:UIApplicationWillEnterForegroundNotification]) {
    newState = @"background";
  } else {
    newState = ABI38_0_0RCTCurrentAppState();
  }

  if (![newState isEqualToString:_lastKnownState]) {
    _lastKnownState = newState;
    [self sendEventWithName:@"appStateDidChange"
                       body:@{@"app_state": _lastKnownState}];
  }
}

#pragma mark - Public API

/**
 * Get the current background/foreground state of the app
 */
ABI38_0_0RCT_EXPORT_METHOD(getCurrentAppState:(ABI38_0_0RCTResponseSenderBlock)callback
                  error:(__unused ABI38_0_0RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": ABI38_0_0RCTCurrentAppState()}]);
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeAppStateSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTAppStateCls(void) {
  return ABI38_0_0RCTAppState.class;
}
