// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXLegacyAppDelegateWrapper.h>

#import <Expo/EXAppDelegatesLoader.h>

// `AppDelegatesLoaderDelegate` and `EXAppDelegateSubscriberProtocol` both live in
// ExpoModulesCore, so import its generated Swift header rather than `Expo-Swift.h`.
// This keeps the ObjC target from depending on the `Expo` Swift target (which would
// be a SwiftPM target cycle).
// With precompiled xcframeworks / use_frameworks! the header is inside the ExpoModulesCore
// module (angle-bracket form); in the static-library source build it's reachable only as a
// double-quoted local include.
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#elif __has_include("ExpoModulesCore-Swift.h")
#import "ExpoModulesCore-Swift.h"
#endif

// Make the legacy wrapper conform to the protocol for subscribers.
@interface EXLegacyAppDelegateWrapper () <EXAppDelegateSubscriberProtocol>
@end

@implementation EXAppDelegatesLoader

// App delegate providers must be registered before any `AppDelegate` life-cycle event is called.
// Unfortunately it's not possible in Swift to run code right after the binary is loaded
// and before any code is executed, so we switch back to Objective-C just to do this one thing.
+ (void)load
{
  [AppDelegatesLoaderDelegate registerAppDelegateSubscribers:[[EXLegacyAppDelegateWrapper alloc] init]];
}

@end
