// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXKernelService.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * Handles logic for Branch deep links and integration with the versioned
 * RN bindings. Based loosely on RNBranch.h but handles versionning and limit
 * usage to standalone apps.
 */
@interface EXBranchManager : NSObject <EXKernelService>

+ (BOOL)isBranchEnabled;

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler;
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation;

@end

NS_ASSUME_NONNULL_END
