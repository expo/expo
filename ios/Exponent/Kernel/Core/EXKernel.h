// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXAppBrowserController.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"
#import "EXViewController.h"
#import "EXPendingNotification.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

typedef NS_ENUM(NSInteger, EXKernelErrorCode) {
  EXKernelErrorCodeModuleDeallocated,
};

// this key is set to YES when crashlytics sends a crash report.
FOUNDATION_EXPORT NSString * const kEXKernelClearJSCacheUserDefaultsKey;

@interface EXKernel : NSObject <EXViewControllerDelegate>

@property (nonatomic, strong, readonly) EXKernelAppRegistry *appRegistry;
@property (nonatomic, strong, readonly) EXKernelServiceRegistry *serviceRegistry;
@property (nonatomic, readonly) EXKernelAppRecord *visibleApp;
@property (nonatomic, assign) id<EXAppBrowserController> browserController;

+ (instancetype)sharedInstance;

- (EXKernelAppRecord *)createNewAppWithUrl:(NSURL *)url initialProps:(nullable NSDictionary *)initialProps;
- (void)switchTasks;
- (void)reloadAppWithExperienceId:(NSString *)experienceId; // called by Updates.reload
- (void)reloadAppFromCacheWithExperienceId:(NSString *)experienceId; // called by Updates.reloadFromCache
- (void)reloadVisibleApp; // called in development whenever the app is reloaded

/**
 *  Send a given notification.
 *  Returns whether the notification has been successfully sent to a running experience.
 */
- (BOOL)sendNotification:(EXPendingNotification *)notification;

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

/**
 *  An id that uniquely identifies this installation of Exponent.
 */
+ (NSString *)deviceInstallUUID;

- (void)logAnalyticsEvent:(NSString *)eventId forAppRecord:(EXKernelAppRecord *)appRecord;

@end

NS_ASSUME_NONNULL_END
