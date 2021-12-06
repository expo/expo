// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXFacebook/ABI44_0_0EXFacebookAppDelegate.h>
#import <ABI44_0_0EXFacebook/ABI44_0_0EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <objc/runtime.h>

@implementation ABI44_0_0EXFacebookAppDelegate

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(ABI44_0_0EXFacebookAppDelegate)

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
