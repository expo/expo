// Copyright 2016-present 650 Industries. All rights reserved.

#import <GoogleSignIn/GIDSignIn.h>
#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <EXGoogleSignIn/EXGoogleSignInAppDelegate.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

@implementation EXGoogleSignInAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXGoogleSignInDelegate)

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [[GIDSignIn sharedInstance] handleURL:url];
}

@end
