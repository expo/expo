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

// [JS thread]
- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  _appContext = [[EXAppContext alloc] init];

  // Inject and decorate the `global.expo` object
  _appContext._runtime = [[EXRuntime alloc] initWithRuntime:runtime];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [_appContext registerNativeModules];
}

@end
