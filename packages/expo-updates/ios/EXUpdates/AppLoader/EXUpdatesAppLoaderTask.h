//  Copyright © 2020 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@class EXUpdatesAppLoaderTask;

@protocol EXUpdatesAppLoaderTaskDelegate <NSObject>

/**
 * This method gives the calling class an opportunity to abort the task early if, for
 * example, we need to restart with a different configuration after getting the initial
 * manifest.
 *
 * Return value should indicate whether to continue loading this app. `YES` will continue
 * loading with the provided configuration, `NO` will abort the task and no other delegate
 * methods will be fired.
 */
- (BOOL)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didLoadCachedUpdate:(EXUpdatesUpdate *)update;
- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didStartLoadingUpdate:(EXUpdatesUpdate *)update;
- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithLauncher:(id<EXUpdatesAppLauncher>)launcher;
- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFinishWithError:(NSError *)error;
- (void)appLoaderTask:(EXUpdatesAppLoaderTask *)appLoaderTask didFireEventWithType:(NSString *)type body:(NSDictionary *)body;

@end

@interface EXUpdatesAppLoaderTask : NSObject

@property (nonatomic, weak) id<EXUpdatesAppLoaderTaskDelegate> delegate;

- (instancetype)initWithConfig:(EXUpdatesConfig *)config
                      database:(EXUpdatesDatabase *)database
                     directory:(NSURL *)directory
               selectionPolicy:(id<EXUpdatesSelectionPolicy>)selectionPolicy
                 delegateQueue:(dispatch_queue_t)delegateQueue;

- (void)start;

@end

NS_ASSUME_NONNULL_END
