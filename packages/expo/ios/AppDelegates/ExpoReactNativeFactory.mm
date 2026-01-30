// Copyright 2025-present 650 Industries. All rights reserved.

#import <Expo/ExpoReactNativeFactory.h>

#import <ExpoModulesCore/ExpoModulesCore.h>
#import <ExpoModulesCore/EXRuntime.h>
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif
#import <ReactCommon/RCTHost.h>

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
}

#pragma mark - RCTHostDelegate

// [main thread]
- (void)hostDidStart:(nonnull RCTHost *)host
{
  // Setting the runtime delegate here doesn't feel right, but there is no other way
  // to capture the `host:didInitializeRuntime:` method call.
  // With the current API design we also depend that the runtime is initialized after the host started,
  // which isn't obvious, especially they are invoked on different threads.
  // Ideally if the current `RCTHostRuntimeDelegate` is part of `RCTHostDelegate`.
  host.runtimeDelegate = self;
}

#pragma mark - RCTHostRuntimeDelegate

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  _appContext = [[EXAppContext alloc] init];

  // Inject and decorate the `global.expo` object
  [_appContext setRuntime:[[EXRuntimeWrapper alloc] init:runtime]];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [_appContext registerNativeModules];
}

@end
