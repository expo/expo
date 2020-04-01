// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuthAppDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>
#import <EXAppAuth/EXAppAuthSessionsManager.h>
#import <UMCore/UMModuleRegistryProvider.h>

@implementation EXAppAuthAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXAppAuthAppDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [(EXAppAuthSessionsManager *)[UMModuleRegistryProvider getSingletonModuleForClass:EXAppAuthSessionsManager.class] application:app openURL:url options:options];
}

@end
