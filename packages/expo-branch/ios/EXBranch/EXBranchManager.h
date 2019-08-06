// Copyright 2019-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <UMCore/UMSingletonModule.h>
#import <EXBranch/RNBranch.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXBranchManager : UMSingletonModule <UIApplicationDelegate>

+ (BOOL)isBranchEnabled;

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions;
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler;
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation;

@end

NS_ASSUME_NONNULL_END
