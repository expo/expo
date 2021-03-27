//  Copyright © 2020 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncLauncher.h>
#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXSyncBackgroundManifestStatus) {
  EXSyncBackgroundManifestStatusError = 0,
  EXSyncBackgroundUpdateStatusNoManifestAvailable = 1,
  EXSyncBackgroundUpdateStatusManifestAvailable = 2
};

@class EXSyncLoaderTask;

@protocol EXSyncLoaderTaskDelegate <NSObject>

/**
 * This method gives the delegate a backdoor option to ignore the cached update and force
 * a remote load if it decides the cached update is not runnable. Returning NO from this
 * callback will force a remote load, overriding the timeout and configuration settings for
 * whether or not to check for a remote update. Returning YES from this callback will make
 * EXSyncLoaderTask proceed as usual.
 */
- (BOOL)appLoaderTask:(EXSyncLoaderTask *)appLoaderTask didLoadCachedUpdate:(EXSyncManifest *)update;
- (void)appLoaderTask:(EXSyncLoaderTask *)appLoaderTask didStartLoadingUpdate:(EXSyncManifest *)update;
- (void)appLoaderTask:(EXSyncLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXSyncLauncher>)launcher isUpToDate:(BOOL)isUpToDate;
- (void)appLoaderTask:(EXSyncLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(EXSyncLoaderTask *)appLoaderTask didFinishBackgroundUpdateWithStatus:(EXSyncBackgroundManifestStatus)status update:(nullable EXSyncManifest *)update error:(nullable NSError *)error;

@end

@interface EXSyncLoaderTask : NSObject

@property (nonatomic, weak) id<EXSyncLoaderTaskDelegate> delegate;

- (instancetype)initWithConfig:(EXSyncConfig *)config
                      database:(EXSyncDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<EXSyncSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
