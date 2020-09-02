// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXFacebook/ABI39_0_0EXFacebookAppDelegate.h>
#import <ABI39_0_0EXFacebook/ABI39_0_0EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppDelegateWrapper.h>
#import <objc/runtime.h>

@implementation ABI39_0_0EXFacebookAppDelegate

ABI39_0_0UM_REGISTER_SINGLETON_MODULE(ABI39_0_0EXFacebookAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
   return [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if ([[FBSDKApplicationDelegate sharedInstance] application:app
                                                     openURL:url
                                                     options:options]) {
    return YES;
  }

  return NO;
}

@end
