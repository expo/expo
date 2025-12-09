// Copyright 2025-present 650 Industries. All rights reserved.

#import <ReactCommon/RCTHost.h>

#import <Expo/ExpoReactNativeFactory.h>
#import <ExpoModulesCore/ExpoModulesCore.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore-Swift.h>

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
}

// TODO: Remove check when react-native-macos 0.81 is released (this init was not available before)
#if !TARGET_OS_OSX
- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel
{
  if (self = [super initWithDelegate:delegate releaseLevel:releaseLevel]) {
    _appContext = [[EXAppContext alloc] init];
  }
  return self;
}
#endif

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
  // Inject and decorate the `global.expo` object
  _appContext._runtime = [[EXRuntime alloc] initWithRuntime:runtime];

  [_appContext registerNativeModules];
}

@end
