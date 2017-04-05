// This class contains any singleton kernel logic that needs to live in obj-c.
// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXKernelBridgeRegistry.h"
#import "EXErrorRecoveryManager.h"
#import "EXKernelModule.h"
#import "EXKernelUtil.h"

@class EXViewController;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSNotificationName kEXKernelOpenUrlNotification;
FOUNDATION_EXPORT NSNotificationName kEXKernelRefreshForegroundTaskNotification;
FOUNDATION_EXPORT NSNotificationName kEXKernelGetPushTokenNotification;
FOUNDATION_EXPORT NSNotificationName kEXKernelJSIsLoadedNotification;
FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

// this key is set to YES when crashlytics sends a crash report.
FOUNDATION_EXPORT NSString * const kEXKernelClearJSCacheUserDefaultsKey;

@interface EXKernel : NSObject <EXKernelModuleDelegate>

+ (instancetype)sharedInstance;

- (void)dispatchKernelJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^_Nullable)(NSDictionary * _Nullable ))success
              onFailure: (void (^_Nullable)(NSString * _Nullable ))failure;
- (void)sendNotification: (NSDictionary *)notifBody
      toExperienceWithId: (NSString *)experienceId
          fromBackground: (BOOL)isFromBackground
                isRemote: (BOOL)isRemote;

- (void)registerRootExponentViewController: (EXViewController *)exponentViewController;
- (EXViewController *)rootViewController;

/**
 *  Similar to UIViewController::supportedInterfaceOrientations, but the value can vary depending on
 *  which JS task is visible.
 */
- (UIInterfaceOrientationMask)supportedInterfaceOrientationsForForegroundTask;

@property (nonatomic, strong, readonly) EXKernelBridgeRegistry *bridgeRegistry;
@property (nonatomic, strong, readonly) EXErrorRecoveryManager *recoveryManager;

# pragma mark - app-wide linking handlers

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler;

+ (NSURL *)initialUrlFromLaunchOptions: (NSDictionary *)launchOptions;

+ (NSString *)linkingUriForExperienceUri: (NSURL *)uri;

/**
 *  An id that uniquely identifies this installation of Exponent.
 */
+ (NSString *)deviceInstallUUID;

/**
 *  Whether to run a locally-served kernel vs. a production kernel.
 */
+ (BOOL)isDevKernel;

@end

NS_ASSUME_NONNULL_END
