// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXFacebook/ABI34_0_0EXFacebookAppDelegate.h>
#import <ABI34_0_0EXFacebook/ABI34_0_0EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMAppDelegateWrapper.h>

@implementation ABI34_0_0EXFacebookAppDelegate

ABI34_0_0UM_REGISTER_SINGLETON_MODULE(ABI34_0_0EXFacebookAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
   return [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if ([ABI34_0_0EXFacebook facebookAppIdFromNSBundle]) {
    if ([[FBSDKApplicationDelegate sharedInstance] application:app
                                                       openURL:url
                                                       options:options]) {
      return YES;
    }
  }

  return NO;
}

@end
