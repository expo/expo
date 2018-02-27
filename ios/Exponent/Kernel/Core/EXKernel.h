// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXKernelAppRegistry.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"

@class EXViewController;

NS_ASSUME_NONNULL_BEGIN

// TODO: ben: break out to new class?
@protocol EXAppBrowserController

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)toggleMenu;
- (void)showDiagnostics;

@end

FOUNDATION_EXPORT NSNotificationName kEXKernelJSIsLoadedNotification; // TODO: ben: audit
FOUNDATION_EXPORT NSNotificationName kEXKernelAppDidDisplay; // TODO: ben: audit
FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

// this key is set to YES when crashlytics sends a crash report.
FOUNDATION_EXPORT NSString * const kEXKernelClearJSCacheUserDefaultsKey;

@interface EXKernel : NSObject

@property (nonatomic, strong, readonly) EXKernelAppRegistry *appRegistry;
@property (nonatomic, strong, readonly) EXKernelServiceRegistry *serviceRegistry;

+ (instancetype)sharedInstance;

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)switchTasks;
- (void)appDidBecomeVisible:(EXKernelAppRecord *)appRecord;

@property (nonatomic, assign) id<EXAppBrowserController> browserController;
@property (nonatomic, readonly) EXKernelAppRecord *visibleApp;

/**
 *  Dispatch a JS event to the kernel bridge, with optional completion handlers.
 */
// TODO: ben: audit
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
 *  An id that uniquely identifies this installation of Exponent.
 */
+ (NSString *)deviceInstallUUID;

@end

NS_ASSUME_NONNULL_END
