// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFacebook/EXFacebookAppDelegate.h>
#import <EXFacebook/EXFacebook.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <UMCore/UMAppDelegateWrapper.h>
#import <objc/runtime.h>

@protocol EXOverriddingFBSDKInternalUtility <NSObject>

- (BOOL)isRegisteredURLScheme:(NSString *)urlScheme;

@end

static BOOL isRegisteredURLScheme(id self, SEL _cmd, NSString *urlScheme)
{
  // copied from FBSDKInternalUtility.h
  // !!!: Make FB SDK think we can open fb<app id>:// urls
  return ![@[@"fbauth2", @"fbapi", @"fb-messenger-share-api", @"fbshareextension"] containsObject:urlScheme];
}

@implementation EXFacebookAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXFacebookAppDelegate)

- (instancetype)init
{
  if (self = [super init]) {
    // !!!: Make FB SDK think we can open fb<app id>:// urls
    Class internalUtilityClass = NSClassFromString(@"FBSDKInternalUtility");
    Method isRegisteredURLSchemeMethod = class_getClassMethod(internalUtilityClass, @selector(isRegisteredURLScheme:));
    method_setImplementation(isRegisteredURLSchemeMethod, (IMP)isRegisteredURLScheme);
  }
  return self;
}

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
