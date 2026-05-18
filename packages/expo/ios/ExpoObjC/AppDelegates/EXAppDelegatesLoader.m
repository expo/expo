// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXLegacyAppDelegateWrapper.h>

#import <Expo/EXAppDelegatesLoader.h>

#if __has_include(<Expo/Expo-Swift.h>)
#import <Expo/Expo-Swift.h>
#elif __has_include("Expo-Swift.h")
#import "Expo-Swift.h"
#else
// Under SwiftPM, ExpoObjC is a separate Clang target from the Expo Swift target,
// so the generated `Expo-Swift.h` isn't on this target's include path. Forward-
// declare just the symbols we use here.
@protocol EXAppDelegateSubscriberProtocol;
@interface AppDelegatesLoaderDelegate : NSObject
+ (void)registerAppDelegateSubscribers:(id<EXAppDelegateSubscriberProtocol>)subscriber;
@end
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
