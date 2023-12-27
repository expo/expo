// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppDelegatesLoader.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXNativeModulesProxy.h>

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
// When `use_frameworks!` is used, the generated Swift header is inside ExpoModulesCore module.
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0ExpoModulesCore-Swift.h>
#else
#import "ABI44_0_0ExpoModulesCore-Swift.h"
#endif

// Make the legacy wrapper conform to the protocol for subscribers.
@interface ABI44_0_0EXLegacyAppDelegateWrapper () <ABI44_0_0EXAppDelegateSubscriberProtocol>
@end

@implementation ABI44_0_0EXAppDelegatesLoader

// App delegate providers must be registered before any `AppDelegate` life-cycle event is called.
// Unfortunately it's not possible in Swift to run code right after the binary is loaded
// and before any code is executed, so we switch back to Objective-C just to do this one thing.
+ (void)load
{
  id<ModulesProviderObjCProtocol> modulesProvider = [ABI44_0_0EXNativeModulesProxy getExpoModulesProvider];
  [ABI44_0_0EXExpoAppDelegate registerSubscriber:[[ABI44_0_0EXLegacyAppDelegateWrapper alloc] init]];
  [ABI44_0_0EXExpoAppDelegate registerSubscribersFromModulesProvider:modulesProvider];
  [ABI44_0_0EXExpoAppDelegate registerReactDelegateHandlersFromModulesProvider:modulesProvider];
}

@end
