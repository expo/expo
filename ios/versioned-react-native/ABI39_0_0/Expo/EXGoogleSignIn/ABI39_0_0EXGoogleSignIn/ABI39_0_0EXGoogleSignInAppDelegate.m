// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMAppDelegateWrapper.h>
#import <ABI39_0_0EXGoogleSignIn/ABI39_0_0EXGoogleSignInAppDelegate.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

@implementation ABI39_0_0EXGoogleSignInAppDelegate

ABI39_0_0UM_REGISTER_SINGLETON_MODULE(ABI39_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
