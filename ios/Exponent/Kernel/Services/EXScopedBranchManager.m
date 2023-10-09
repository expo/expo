#if __has_include(<EXBranch/EXBranchManager.h>)

// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBranchManager.h"
#import "EXScopedBranch.h"

#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXScopedBranch.h"

// These constants need to stay in sync with the ones in RNBranch.
NSString * const EXBranchLinkOpenedNotificationErrorKey = @"error";
NSString * const EXBranchLinkOpenedNotificationParamsKey = @"params";
NSString * const EXBranchLinkOpenedNotificationUriKey = @"uri";
NSString * const EXBranchLinkOpenedNotification = @"RNBranchLinkOpenedNotification";

@interface EXScopedBranchModuleAvoidWarnings
- (void)onInitSessionFinished:(NSNotification *)notification;
@end

@implementation EXScopedBranchManager
{
  NSDictionary *_launchOptions;
  BOOL _isInitialized;
  NSURL *_url;
}

EX_REGISTER_SINGLETON_MODULE(BranchManager);

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _launchOptions = launchOptions;
  _url = launchOptions[UIApplicationLaunchOptionsURLKey];
  [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  _url = userActivity.webpageURL;
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  _url = url;
  return [super application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

- (void)branchModuleDidInit:(id)versionedBranchModule
{
}

@end

#endif
