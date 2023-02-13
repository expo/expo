//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLauncher.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesSelectionPolicy.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI48_0_0EXUpdatesBackgroundUpdateStatus) {
  ABI48_0_0EXUpdatesBackgroundUpdateStatusError = 0,
  ABI48_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable = 1,
  ABI48_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable = 2
};

@class ABI48_0_0EXUpdatesAppLoaderTask;

@protocol ABI48_0_0EXUpdatesAppLoaderTaskDelegate <NSObject>

/**
 * This method gives the delegate a backdoor option to ignore the cached update and force
 * a remote load if it decides the cached update is not runnable. Returning NO from this
 * callback will force a remote load, overriding the timeout and configuration settings for
 * whether or not to check for a remote update. Returning YES from this callback will make
 * ABI48_0_0EXUpdatesAppLoaderTask proceed as usual.
 */
- (BOOL)appLoaderTask:(ABI48_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(ABI48_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI48_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI48_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI48_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI48_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate;
- (void)appLoaderTask:(ABI48_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(ABI48_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI48_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI48_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error;

@end

@interface ABI48_0_0EXUpdatesAppLoaderTask : NSObject

@property (nonatomic, weak) id<ABI48_0_0EXUpdatesAppLoaderTaskDelegate> delegate;

@property (nonatomic, assign, readonly) BOOL isRunning;

- (instancetype)initWithConfig:(ABI48_0_0EXUpdatesConfig *)config
                      database:(ABI48_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(ABI48_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
