// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXBranch/EXBranchManager.h>
#import <UMCore/UMDefines.h>
#import <Branch/Branch.h>

@implementation EXBranchManager

UM_REGISTER_SINGLETON_MODULE(BranchManager)

+ (BOOL)isBranchEnabled
{
  id branchKey = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"branch_key"];
  return (branchKey != nil);
}

#pragma mark - linking hooks

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  if ([[self class] isBranchEnabled]) {
    [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES];
  }
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  if (![[self class] isBranchEnabled]) {
    return NO;
  }
  return [RNBranch continueUserActivity:userActivity];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if (![[self class] isBranchEnabled]) {
    return NO;
  }
  return [RNBranch.branch application:application openURL:url sourceApplication:sourceApplication annotation:annotation];
}

@end
