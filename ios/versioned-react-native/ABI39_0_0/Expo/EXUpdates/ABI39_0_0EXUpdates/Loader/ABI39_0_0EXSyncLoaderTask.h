//  Copyright © 2020 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncLauncher.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI39_0_0EXSyncBackgroundManifestStatus) {
  ABI39_0_0EXSyncBackgroundManifestStatusError = 0,
  ABI39_0_0EXSyncBackgroundUpdateStatusNoManifestAvailable = 1,
  ABI39_0_0EXSyncBackgroundUpdateStatusManifestAvailable = 2
};

@class ABI39_0_0EXSyncLoaderTask;

@protocol ABI39_0_0EXSyncLoaderTaskDelegate <NSObject>

/**
 * This method gives the delegate a backdoor option to ignore the cached update and force
 * a remote load if it decides the cached update is not runnable. Returning NO from this
 * callback will force a remote load, overriding the timeout and configuration settings for
 * whether or not to check for a remote update. Returning YES from this callback will make
 * ABI39_0_0EXSyncLoaderTask proceed as usual.
 */
- (BOOL)appLoaderTask:(ABI39_0_0EXSyncLoaderTask *)appLoaderTask didLoadCachedUpdate:(ABI39_0_0EXSyncManifest *)update;
- (void)appLoaderTask:(ABI39_0_0EXSyncLoaderTask *)appLoaderTask didStartLoadingUpdate:(ABI39_0_0EXSyncManifest *)update;
- (void)appLoaderTask:(ABI39_0_0EXSyncLoaderTask *)appLoaderTask didFinishWithLauncher:(id<ABI39_0_0EXSyncLauncher>)launcher isUpToDate:(BOOL)isUpToDate;
- (void)appLoaderTask:(ABI39_0_0EXSyncLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(ABI39_0_0EXSyncLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(ABI39_0_0EXSyncBackgroundManifestStatus)status update:(nullable ABI39_0_0EXSyncManifest *)update error:(nullable NSError *)error;

@end

@interface ABI39_0_0EXSyncLoaderTask : NSObject

@property (nonatomic, weak) id<ABI39_0_0EXSyncLoaderTaskDelegate> delegate;

- (instancetype)initWithConfig:(ABI39_0_0EXSyncConfig *)config
                      database:(ABI39_0_0EXSyncDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<ABI39_0_0EXSyncSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
