// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXLegacyAppDelegateWrapper.h>

#import <Expo/EXAppDelegatesLoader.h>

// `AppDelegatesLoaderDelegate` and `EXAppDelegateSubscriberProtocol` both live in
// ExpoModulesCore, so import its generated Swift header rather than `Expo-Swift.h`.
// This keeps the ObjC target from depending on the `Expo` Swift target (which would
// be a SwiftPM target cycle).
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>

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
