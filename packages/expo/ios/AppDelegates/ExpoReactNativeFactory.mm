// Copyright 2025-present 650 Industries. All rights reserved.

#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <Expo/ExpoReactNativeFactory.h>
#import <ExpoModulesCore/ExpoModulesCore.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore-Swift.h>

// `RCTReactNativeFactory` doesn't publicly expose its conformance to `RCTTurboModuleManagerDelegate`
@interface RCTReactNativeFactory (TurboModuleManagerDelegate) <RCTTurboModuleManagerDelegate>
@end

@implementation EXReactNativeFactory {
  EXAppContext *_appContext;
  std::shared_ptr<react::CallInvoker> _callInvoker;
}

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel
{
  if (self = [super initWithDelegate:delegate releaseLevel:releaseLevel]) {
    // App context initialization step #0
    _appContext = [[EXAppContext alloc] init];
  }
  return self;
}

- (nonnull EXAppContext *)appContext
{
  return _appContext;
}

#pragma mark - RCTTurboModuleManagerDelegate

// [JS thread]
- (std::shared_ptr<react::TurboModule>)getTurboModule:(const std::string &)name jsInvoker:(std::shared_ptr<react::CallInvoker>)jsInvoker
{
  // App context initialization step #3
  // To properly support async functions we need access to the call invoker.
  // It's not great that we have to do it in a function that is called many times (every time a turbo module is being registered).
  [_appContext._runtime setCallInvoker:jsInvoker];

  // Let the base `RCTReactNativeFactory` delegate it to the proper `RCTTurboModuleManagerDelegate`.
  return [super getTurboModule:name jsInvoker:jsInvoker];
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

  // App context initialization step #1
  // The app context may need access to the host to get the surface presenter, mounting manager etc.
  _appContext.host = host;
}

#pragma mark - RCTHostRuntimeDelegate

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  // App context initialization step #2
  // Here we start injecting and decorating the `global.expo` object.
  _appContext._runtime = [[EXRuntime alloc] initWithRuntime:runtime];
  [_appContext useModulesProvider:@"ExpoModulesProvider"];
}

@end
