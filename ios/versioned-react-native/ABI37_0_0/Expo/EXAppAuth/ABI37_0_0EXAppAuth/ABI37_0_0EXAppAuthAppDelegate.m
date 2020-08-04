// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuthAppDelegate.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMAppDelegateWrapper.h>
#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuthSessionsManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryProvider.h>

@implementation ABI37_0_0EXAppAuthAppDelegate

ABI37_0_0UM_REGISTER_SINGLETON_MODULE(ABI37_0_0EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(ABI37_0_0EXAppAuthSessionsManager *)[ABI37_0_0UMModuleRegistryProvider getSingletonModuleForClass:ABI37_0_0EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
