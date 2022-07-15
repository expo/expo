// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXLegacyAppDelegateWrapper.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppDelegatesLoader.h>
#import <ABI46_0_0ExpoModulesCore/Swift.h>

// Make the legacy wrapper conform to the protocol for subscribers.
@interface ABI46_0_0EXLegacyAppDelegateWrapper () <ABI46_0_0EXAppDelegateSubscriberProtocol>
@end

@implementation ABI46_0_0EXAppDelegatesLoader

// App delegate providers must be registered before any `AppDelegate` life-cycle event is called.
// Unfortunately it's not possible in Swift to run code right after the binary is loaded
// and before any code is executed, so we switch back to Objective-C just to do this one thing.
+ (void)load
{
  ModulesProvider *modulesProvider = [ABI46_0_0EXAppContext modulesProviderWithName:@"ExpoModulesProvider"];
  [ABI46_0_0EXExpoAppDelegate registerSubscriber:[[ABI46_0_0EXLegacyAppDelegateWrapper alloc] init]];
  [ABI46_0_0EXExpoAppDelegate registerSubscribersFromModulesProvider:modulesProvider];
  [ABI46_0_0EXExpoAppDelegate registerReactDelegateHandlersFromModulesProvider:modulesProvider];
}

@end
