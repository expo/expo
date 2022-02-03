// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXFacebook/ABI43_0_0EXFacebookAppDelegate.h>
#import <ABI43_0_0EXFacebook/ABI43_0_0EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppDelegateWrapper.h>
#import <objc/runtime.h>

@implementation ABI43_0_0EXFacebookAppDelegate

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(ABI43_0_0EXFacebookAppDelegate)

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
