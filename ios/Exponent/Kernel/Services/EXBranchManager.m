// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBranchManager.h"

#import <Branch/Branch.h>

#import "EXReactAppManager.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXShellManager.h"

// These constants need to stay in sync with the ones in RNBranch.
NSString * const EXBranchLinkOpenedNotificationErrorKey = @"error";
NSString * const EXBranchLinkOpenedNotificationParamsKey = @"params";
NSString * const EXBranchLinkOpenedNotificationUriKey = @"uri";
NSString * const EXBranchLinkOpenedNotification = @"RNBranchLinkOpenedNotification";

@interface RNBranchModuleAvoidWarnings
- (void)onInitSessionFinished:(NSNotification *)notification;
@end

@implementation EXBranchManager
{
  NSDictionary *_launchOptions;
  BOOL _isInitialized;
  NSURL *_url;
  EXReactAppManager *_appManager;
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

- (void)registerAppManager:(EXFrameReactAppManager *)appManager
{
  // The first EXFrameReactAppManager will always be the standalone app one.
  if (_appManager == nil &&
      [EXShellManager sharedInstance].isShell) {
    _appManager = appManager;
    [self tryInitBranch];
  }
}

- (void)invalidate
{
  _appManager = nil;
}

- (void)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  _launchOptions = launchOptions;
  _url = launchOptions[UIApplicationLaunchOptionsURLKey];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray * _Nullable))restorationHandler
{
  if (!_isInitialized) {
    return NO;
  }
  _url = userActivity.webpageURL;
  return [[Branch getInstance] continueUserActivity:userActivity];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if (!_isInitialized) {
    return NO;
  }
  _url = url;
  return [[Branch getInstance] handleDeepLink:url];
}

- (void)tryInitBranch
{
  if (_appManager == nil || _isInitialized) {
    return;
  }

  _isInitialized = YES;

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
    if (_url) {
      result[EXBranchLinkOpenedNotificationUriKey] = _url;
    }

    // We can't use RNBranch static methods directly because it uses event dispatch
    // and every instance of the native module will register to it causing duplicate
    // events (one for each bridge). As a workaround call the event listener manually
    // on the native module of the standalone app.
    NSNotification *notification =
      [[NSNotification alloc] initWithName:EXBranchLinkOpenedNotification object:self userInfo:result];
    id branchModule = [[EXKernel sharedInstance] nativeModuleForAppManager:_appManager named:@"RNBranch"];
    [branchModule onInitSessionFinished:notification];
  }];
}

@end
