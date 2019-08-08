// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebookAppDelegate.h>
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <UMCore/UMAppDelegateWrapper.h>

@implementation EXFacebookAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXFacebookAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
   return [[FBSDKApplicationDelegate sharedInstance] application:application
                             didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if ([EXFacebook facebookAppIdFromNSBundle]) {
    if ([[FBSDKApplicationDelegate sharedInstance] application:app
                                                       openURL:url
                                                       options:options]) {
      return YES;
    }
  }

  return NO;
}

@end
