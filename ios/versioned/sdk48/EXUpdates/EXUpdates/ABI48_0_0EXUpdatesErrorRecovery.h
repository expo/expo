//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLauncher.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI48_0_0EXUpdatesRemoteLoadStatus) {
  ABI48_0_0EXUpdatesRemoteLoadStatusIdle,
  ABI48_0_0EXUpdatesRemoteLoadStatusLoading,
  ABI48_0_0EXUpdatesRemoteLoadStatusNewUpdateLoaded
};

@protocol ABI48_0_0EXUpdatesErrorRecoveryDelegate <NSObject>

@property (nonatomic, readonly, strong) ABI48_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly, strong) ABI48_0_0EXUpdatesUpdate *launchedUpdate;
@property (nonatomic, readonly, assign) ABI48_0_0EXUpdatesRemoteLoadStatus remoteLoadStatus;

- (void)relaunchWithCompletion:(ABI48_0_0EXUpdatesAppLauncherCompletionBlock)completion;
- (void)loadRemoteUpdate;

- (void)markFailedLaunchForLaunchedUpdate;
- (void)markSuccessfulLaunchForLaunchedUpdate;

- (void)throwException:(NSException *)exception;

@end

@interface ABI48_0_0EXUpdatesErrorRecovery : NSObject

@property (nonatomic, weak) id<ABI48_0_0EXUpdatesErrorRecoveryDelegate> delegate;

// for testing purposes
- (instancetype)initWithErrorRecoveryQueue:(dispatch_queue_t)errorRecoveryQueue
                            diskWriteQueue:(nullable dispatch_queue_t)diskWriteQueue
                         remoteLoadTimeout:(NSInteger)remoteLoadTimeout;

- (void)startMonitoring;

- (void)handleError:(NSError *)error;
- (void)handleException:(NSException *)exception;
- (void)notifyNewRemoteLoadStatus:(ABI48_0_0EXUpdatesRemoteLoadStatus)newStatus;

+ (nullable NSString *)consumeErrorLog;
- (void)writeErrorOrExceptionToLog:(id)errorOrException;

@end

NS_ASSUME_NONNULL_END
