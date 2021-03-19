//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesAppLauncher.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesSelectionPolicy.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI41_0_0EXUpdatesBackgroundUpdateStatus) {
  ABI41_0_0EXUpdatesBackgroundUpdateStatusError = 0,
  ABI41_0_0EXUpdatesBackgroundUpdateStatusNoUpdateAvailable = 1,
  ABI41_0_0EXUpdatesBackgroundUpdateStatusUpdateAvailable = 2
};

@class ABI41_0_0EXUpdatesAppLoaderTask;

@protocol ABI41_0_0EXUpdatesAppLoaderTaskDelegate <NSObject>

/**
 * This method gives the delegate a backdoor option to ignore the cached update and force
 * a remote load if it decides the cached update is not runnable. Returning NO from this
 * callback will force a remote load, overriding the timeout and configuration settings for
 * whether or not to check for a remote update. Returning YES from this callback will make
 * ABI41_0_0EXUpdatesAppLoaderTask proceed as usual.
 */
- (BOOL)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(ABI41_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI41_0_0EXUpdatesUpdate *)update;
- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI41_0_0EXUpdatesAppLauncher>)launcher isUpToDate:(BOOL)isUpToDate;
- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(ABI41_0_0EXUpdatesAppLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI41_0_0EXUpdatesBackgroundUpdateStatus)status update:(nullable ABI41_0_0EXUpdatesUpdate *)update error:(nullable NSError *)error;

@end

@interface ABI41_0_0EXUpdatesAppLoaderTask : NSObject

@property (nonatomic, weak) id<ABI41_0_0EXUpdatesAppLoaderTaskDelegate> delegate;

- (instancetype)initWithConfig:(ABI41_0_0EXUpdatesConfig *)config
                      database:(ABI41_0_0EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<ABI41_0_0EXUpdatesSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
