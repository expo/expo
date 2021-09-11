//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesRemoteLoadStatus) {
  EXUpdatesRemoteLoadStatusIdle,
  EXUpdatesRemoteLoadStatusLoading,
  EXUpdatesRemoteLoadStatusNewUpdateLoaded
};

@protocol EXUpdatesErrorRecoveryDelegate <NSObject>

@property (nonatomic, readonly, strong) EXUpdatesDatabase *database;
@property (nonatomic, readonly, assign) EXUpdatesRemoteLoadStatus remoteLoadStatus;

- (void)relaunchWithCompletion:(EXUpdatesAppLauncherCompletionBlock)completion;
- (BOOL)relaunchUsingEmbeddedUpdate;

@end

@interface EXUpdatesErrorRecovery : NSObject

@property (nonatomic, weak) id<EXUpdatesErrorRecoveryDelegate> delegate;

// for testing purposes
- (instancetype)initWithErrorRecoveryQueue:(dispatch_queue_t)errorRecoveryQueue
                            diskWriteQueue:(nullable dispatch_queue_t)diskWriteQueue
                         remoteLoadTimeout:(NSInteger)remoteLoadTimeout;

- (void)handleError:(NSError *)error fromLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate;
- (void)handleException:(NSException *)exception fromLaunchedUpdate:(nullable EXUpdatesUpdate *)launchedUpdate;
- (void)notifyNewRemoteLoadStatus:(EXUpdatesRemoteLoadStatus)newStatus;

+ (nullable NSString *)consumeErrorLog;
- (void)writeErrorOrExceptionToLog:(id)errorOrException;

@end

NS_ASSUME_NONNULL_END
