// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegatesLoader.h>
#import <ExpoModulesCore/EXNativeModulesProxy.h>

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
// When `use_frameworks!` is used, the generated Swift header is inside ExpoModulesCore module.
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
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
  id<ModulesProviderObjCProtocol> modulesProvider = [EXNativeModulesProxy getExpoModulesProvider];
  [EXExpoAppDelegate registerSubscriber:[[EXLegacyAppDelegateWrapper alloc] init]];
  [EXExpoAppDelegate registerSubscribersFromModulesProvider:modulesProvider];
  [EXExpoAppDelegate registerReactDelegateHandlersFromModulesProvider:modulesProvider];
}

@end
