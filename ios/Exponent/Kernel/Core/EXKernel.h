// This class contains any singleton kernel logic that needs to live in obj-c.
// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXKernelBridgeRegistry.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"

@class EXViewController;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSNotificationName kEXKernelJSIsLoadedNotification;
FOUNDATION_EXPORT NSNotificationName kEXKernelAppDidDisplay;
FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

// this key is set to YES when crashlytics sends a crash report.
FOUNDATION_EXPORT NSString * const kEXKernelClearJSCacheUserDefaultsKey;

@interface EXKernel : NSObject

@property (nonatomic, strong, readonly) EXKernelBridgeRegistry *bridgeRegistry;
@property (nonatomic, strong, readonly) EXKernelServiceRegistry *serviceRegistry;

+ (instancetype)sharedInstance;

/**
 *  Dispatch a JS event to the kernel bridge, with optional completion handlers.
 */
- (void)dispatchKernelJSEvent: (NSString *)eventName
                   body: (NSDictionary *)eventBody
              onSuccess: (void (^_Nullable)(NSDictionary * _Nullable ))success
              onFailure: (void (^_Nullable)(NSString * _Nullable ))failure;

/**
 *  Send a notification to a given experience id.
 */
- (void)sendNotification: (NSDictionary *)notifBody
      toExperienceWithId: (NSString *)experienceId
          fromBackground: (BOOL)isFromBackground
                isRemote: (BOOL)isRemote;

- (void)registerRootExponentViewController: (EXViewController *)exponentViewController;
- (EXViewController *)rootViewController;

/**
 *  Find and return the (potentially versioned) native module instance belonging to the
 *  specified app manager. Module name is the exported name such as @"AppState".
 */
- (id)nativeModuleForAppManager:(EXReactAppManager *)appManager named:(NSString *)moduleName;

/**
 *  Send the given url to this app manager (via the Linking module) and foreground it.
 */
- (void)openUrl:(NSString *)url onAppManager:(EXReactAppManager *)appManager;

/**
 *  Update state after a JS task switch.
 */
- (void)handleJSTaskDidForegroundWithType:(NSInteger)type params:(NSDictionary *)params;

/**
 *  An id that uniquely identifies this installation of Exponent.
 */
+ (NSString *)deviceInstallUUID;

@end

NS_ASSUME_NONNULL_END
