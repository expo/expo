// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXAppBrowserController.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"
#import "EXViewController.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

typedef NS_ENUM(NSInteger, EXKernelErrorCode) {
  EXKernelErrorCodeModuleDeallocated,
};

@interface EXKernel : NSObject <EXViewControllerDelegate>

@property (nonatomic, strong, readonly) EXKernelAppRegistry *appRegistry;
@property (nonatomic, strong, readonly) EXKernelServiceRegistry *serviceRegistry;
@property (nonatomic, readonly) EXKernelAppRecord *visibleApp;
@property (nonatomic, assign) id<EXAppBrowserController> browserController;

+ (instancetype)sharedInstance;

- (EXKernelAppRecord *)createNewAppWithUrl:(NSURL *)url initialProps:(nullable NSDictionary *)initialProps;
- (void)switchTasks;
- (void)reloadAppWithScopeKey:(NSString *)scopeKey; // called by Updates.reload
- (void)reloadAppFromCacheWithScopeKey:(NSString *)scopeKey; // called by Updates.reloadFromCache
- (void)reloadVisibleApp; // called in development whenever the app is reloaded

/**
 *  Initial props to pass to an app based on LaunchOptions from UIApplicationDelegate.
 */
- (nullable NSDictionary *)initialAppPropsFromLaunchOptions:(NSDictionary *)launchOptions;

/**
 *  Find and return the (potentially versioned) native module instance belonging to the
 *  specified app manager. Module name is the exported name such as @"AppState".
 */
- (id)nativeModuleForAppManager:(EXReactAppManager *)appManager named:(NSString *)moduleName;

/**
 *  Send the given url to this app (via the RN Linking module) and foreground it.
 */
- (void)sendUrl:(NSString *)url toAppRecord:(EXKernelAppRecord *)app;

@end

NS_ASSUME_NONNULL_END
