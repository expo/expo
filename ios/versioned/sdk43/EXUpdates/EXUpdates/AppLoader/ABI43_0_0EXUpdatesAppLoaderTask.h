//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncher.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicy.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI43_0_0EXUpdatesBackgroundUpdateStatus) {
  ABI43_0_0EXUpdatesBackgroundUpdateStatusError = 0,
  ABI43_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable = 1,
  ABI43_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable = 2
};

@class ABI43_0_0EXUpdatesAppLoaderTask;

@protocol ABI43_0_0EXUpdatesAppLoaderTaskDelegate <NSObject>

/**
 * This method gives the delegate a backdoor option to ignore the cached update and force
 * a remote load if it decides the cached update is not runnable. Returning NO from this
 * callback will force a remote load, overriding the timeout and configuration settings for
 * whether or not to check for a remote update. Returning YES from this callback will make
 * ABI43_0_0EXUpdatesAppLoaderTask proceed as usual.
 */
- (BOOL)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(ABI43_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI43_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI43_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate;
- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(ABI43_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI43_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI43_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error;

@end

@interface ABI43_0_0EXUpdatesAppLoaderTask : NSObject

@property (nonatomic, weak) id<ABI43_0_0EXUpdatesAppLoaderTaskDelegate> delegate;

- (instancetype)initWithConfig:(ABI43_0_0EXUpdatesConfig *)config
                      database:(ABI43_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
