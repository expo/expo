//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppController.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesAppLauncher.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesSelectionPolicy.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesAppController (Internal)

@property (nonatomic, readonly) dispatch_queue_t controllerQueue;

- (BOOL)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error;
- (BOOL)initializeUpdatesDatabaseWithError:(NSError ** _Nullable)error;

- (void)setDefaultSelectionPolicy:(ABI39_0_0EXUpdatesSelectionPolicy *)selectionPolicy;
- (void)setLauncher:(id<ABI39_0_0EXUpdatesAppLauncher>)launcher;
- (void)setConfigurationInternal:(ABI39_0_0EXUpdatesConfig *)configuration;
- (void)setIsStarted:(BOOL)isStarted;

- (void)runReaper;

@end

NS_ASSUME_NONNULL_END
