//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppController.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLauncher.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesAppController (Internal)

@property (nonatomic, readonly) dispatch_queue_t controllerQueue;

- (BOOL)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error;
- (BOOL)initializeUpdatesDatabaseWithError:(NSError ** _Nullable)error;
- (void)purgeUpdatesLogsOlderThanOneDay;

- (void)setDefaultSelectionPolicy:(ABI48_0_0EXUpdatesSelectionPolicy *)selectionPolicy;
- (void)setLauncher:(nullable id<ABI48_0_0EXUpdatesAppLauncher>)launcher;
- (void)setConfigurationInternal:(ABI48_0_0EXUpdatesConfig *)configuration;
- (void)setIsStarted:(BOOL)isStarted;

- (void)runReaper;

@end

NS_ASSUME_NONNULL_END
