// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBranchManager.h"

#import <Branch/Branch.h>

#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "RNBranch.h"

// These constants need to stay in sync with the ones in RNBranch.
NSString * const EXBranchLinkOpenedNotificationErrorKey = @"error";
NSString * const EXBranchLinkOpenedNotificationParamsKey = @"params";
NSString * const EXBranchLinkOpenedNotificationUriKey = @"uri";
NSString * const EXBranchLinkOpenedNotification = @"RNBranchLinkOpenedNotification";

@interface RNBranchModuleAvoidWarnings
- (void)onInitSessionFinished:(NSNotification *)notification;
@end

@interface EXBranchManager () <EXBranchScopedModuleDelegate>

@end

@implementation EXBranchManager
{
  NSDictionary *_launchOptions;
  BOOL _isInitialized;
  NSURL *_url;
}

+ (instancetype)sharedInstance
{
  static EXBranchManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [EXBranchManager new];
    }
  });
  return theManager;
}

+ (BOOL)isBranchEnabled
{
  id branchKey = [[[NSBundle mainBundle] infoDictionary] objectForKey:@"branch_key"];
  return (branchKey != nil);
}

#pragma mark - linking hooks

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _launchOptions = launchOptions;
  _url = launchOptions[UIApplicationLaunchOptionsURLKey];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  if (![[self class] isBranchEnabled]) {
    return NO;
  }
  _url = userActivity.webpageURL;
  return [[Branch getInstance] continueUserActivity:userActivity];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if (![[self class] isBranchEnabled]) {
    return NO;
  }
  _url = url;
  return [[Branch getInstance] handleDeepLink:url];
}

- (void)branchModuleDidInit:(id)versionedBranchModule
{
  if (_isInitialized || ![[self class] isBranchEnabled]) {
    return;
  }
  RNBranch *branchModule = (RNBranch *)versionedBranchModule;
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
