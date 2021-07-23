// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebookAppDelegate.h>
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <objc/runtime.h>

@implementation EXFacebookAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXFacebookAppDelegate)

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
