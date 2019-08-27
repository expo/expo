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

UM_REGISTER_SINGLETON_MODULE(BranchManager);

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
  if (_isInitialized || ![[self class] isBranchEnabled]) {
    return;
  }

  EXScopedBranch *branchModule = (EXScopedBranch *)versionedBranchModule;
  EXKernelAppRecord *appForModule = [[EXKernel sharedInstance].appRegistry newestRecordWithExperienceId:branchModule.experienceId];
  if (appForModule && appForModule == [EXKernel sharedInstance].appRegistry.standaloneAppRecord) {
    _isInitialized = YES;

    // branch is going to retain the init callback
    __block typeof(self) blockSelf = self;

    [[Branch getInstance] initSessionWithLaunchOptions:_launchOptions
                                          isReferrable:YES
                            andRegisterDeepLinkHandler:^(NSDictionary *params, NSError *error) {
      NSMutableDictionary *result = [NSMutableDictionary dictionary];
      if (error) {
        result[EXBranchLinkOpenedNotificationErrorKey] = error;
      }
      if (params) {
        result[EXBranchLinkOpenedNotificationParamsKey] = params;
      }
      if (blockSelf->_url) {
        result[EXBranchLinkOpenedNotificationUriKey] = blockSelf->_url;
      }

      // We can't use RNBranch static methods directly because it uses event dispatch
      // and every instance of the native module will register to it causing duplicate
      // events (one for each bridge). As a workaround call the event listener manually
      // on the native module of the standalone app.
      NSNotification *notification =
        [[NSNotification alloc] initWithName:EXBranchLinkOpenedNotification object:self userInfo:result];
      [versionedBranchModule onInitSessionFinished:notification];
    }];
  }
}

@end

#endif
