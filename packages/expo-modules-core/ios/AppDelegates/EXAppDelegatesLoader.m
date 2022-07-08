// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXLegacyAppDelegateWrapper.h>

#import <ExpoModulesCore/EXAppDelegatesLoader.h>
#import <ExpoModulesCore/Swift.h>

// Make the legacy wrapper conform to the protocol for subscribers.
@interface EXLegacyAppDelegateWrapper () <EXAppDelegateSubscriberProtocol>
@end

@implementation EXAppDelegatesLoader

// App delegate providers must be registered before any `AppDelegate` life-cycle event is called.
// Unfortunately it's not possible in Swift to run code right after the binary is loaded
// and before any code is executed, so we switch back to Objective-C just to do this one thing.
+ (void)load
{
  ModulesProvider *modulesProvider = [EXAppContext modulesProviderWithName:@"ExpoModulesProvider"];
  [EXExpoAppDelegate registerSubscriber:[[EXLegacyAppDelegateWrapper alloc] init]];
  [EXExpoAppDelegate registerSubscribersFromModulesProvider:modulesProvider];
  [EXExpoAppDelegate registerReactDelegateHandlersFromModulesProvider:modulesProvider];
}

@end
