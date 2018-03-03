// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "EXKernelAppRegistry.h"
#import "EXKernelServiceRegistry.h"
#import "EXKernelUtil.h"

NS_ASSUME_NONNULL_BEGIN

// TODO: ben: break out to new class?
@protocol EXAppBrowserController

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)moveHomeToVisible;
- (void)refreshVisibleApp;
- (void)toggleMenu;
- (void)setIsMenuVisible:(BOOL)isMenuVisible;
- (void)showDiagnostics;
- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString * _Nullable))completion;

@end

FOUNDATION_EXPORT NSNotificationName kEXKernelJSIsLoadedNotification; // TODO: ben: audit
FOUNDATION_EXPORT NSNotificationName kEXKernelAppDidDisplay; // TODO: ben: rename (this is the splash screen hide notif)
FOUNDATION_EXPORT NSString *kEXKernelErrorDomain;

// this key is set to YES when crashlytics sends a crash report.
FOUNDATION_EXPORT NSString * const kEXKernelClearJSCacheUserDefaultsKey;

@interface EXKernel : NSObject

@property (nonatomic, strong, readonly) EXKernelAppRegistry *appRegistry;
@property (nonatomic, strong, readonly) EXKernelServiceRegistry *serviceRegistry;
@property (nonatomic, readonly) EXKernelAppRecord *visibleApp;
@property (nonatomic, assign) id<EXAppBrowserController> browserController;

+ (instancetype)sharedInstance;

- (void)createNewAppWithUrl:(NSURL *)url initialProps:(nullable NSDictionary *)initialProps;
- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)switchTasks;
- (void)appDidBecomeVisible:(EXKernelAppRecord *)appRecord;

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
 *  Send the given url to this app (via the RN Linking module) and foreground it.
 */
- (void)sendUrl:(NSString *)url toAppRecord:(EXKernelAppRecord *)app;

/**
 *  An id that uniquely identifies this installation of Exponent.
 */
+ (NSString *)deviceInstallUUID;

@end

NS_ASSUME_NONNULL_END
