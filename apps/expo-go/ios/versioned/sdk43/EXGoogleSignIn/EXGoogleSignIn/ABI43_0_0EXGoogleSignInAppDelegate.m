// Copyright 2016-present 650 Industries. All rights reserved.

#import <GoogleSignIn/GIDSignIn.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppDelegateWrapper.h>
#import <ABI43_0_0EXGoogleSignIn/ABI43_0_0EXGoogleSignInAppDelegate.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

@implementation ABI43_0_0EXGoogleSignInAppDelegate

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(ABI43_0_0EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
