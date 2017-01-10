// This class contains any singleton kernel logic that needs to live in obj-c.
// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXKernelBridgeRegistry.h"
#import "EXKernelModule.h"
#import "EXKernelUtil.h"

@class EXViewController;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *kEXKernelOpenUrlNotification;
FOUNDATION_EXPORT NSString *kEXKernelRefreshForegroundTaskNotification;
FOUNDATION_EXPORT NSString *kEXKernelGetPushTokenNotification;
FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;
FOUNDATION_EXPORT NSString *kEXKernelBundleResourceName;

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

@end

NS_ASSUME_NONNULL_END
