//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, EXUpdatesRemoteLoadStatus) {
  EXUpdatesRemoteLoadStatusIdle,
  EXUpdatesRemoteLoadStatusLoading,
  EXUpdatesRemoteLoadStatusNewUpdateLoaded
};

@protocol EXUpdatesErrorRecoveryDelegate <NSObject>

@property (nonatomic, readonly, strong) EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, readonly, assign) EXUpdatesRemoteLoadStatus remoteLoadStatus;

- (void)relaunchWithCompletion:(EXUpdatesAppLauncherCompletionBlock)completion;
- (void)loadRemoteUpdate;

- (void)markFailedLaunchForLaunchedUpdate;
- (void)markSuccessfulLaunchForLaunchedUpdate;

- (void)throwException:(NSException *)exception;

@end

@interface EXUpdatesErrorRecovery : NSObject

@property (nonatomic, weak) id<EXUpdatesErrorRecoveryDelegate> delegate;

// for testing purposes
- (instancetype)initWithErrorRecoveryQueue:(dispatch_queue_t)errorRecoveryQueue
                         remoteLoadTimeout:(NSInteger)remoteLoadTimeout;

- (void)startMonitoring;

- (void)handleError:(NSError *)error;
- (void)handleException:(NSException *)exception;
- (void)notifyNewRemoteLoadStatus:(EXUpdatesRemoteLoadStatus)newStatus;

@end

NS_ASSUME_NONNULL_END
