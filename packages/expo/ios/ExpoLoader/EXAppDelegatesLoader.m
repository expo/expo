// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXLegacyAppDelegateWrapper.h>

#import <Expo/EXAppDelegatesLoader.h>

#if __has_include(<Expo/Expo-Swift.h>)
#import <Expo/Expo-Swift.h>
#elif __has_include("Expo-Swift.h")
#import "Expo-Swift.h"
#else
// SwiftPM: ExpoObjC exposes its public headers under `include/Expo/`, so
// `<Expo/...>` resolves to that directory and shadows the Swift module also
// named `Expo` — the generated `Expo-Swift.h` is not reachable by either path.
// Import the Swift half as a module instead.
@import Expo;
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
