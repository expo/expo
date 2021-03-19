// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesSelectionPolicy.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI41_0_0EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol ABI41_0_0EXUpdatesInterface

@property (nonatomic, readonly) ABI41_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly) ABI41_0_0EXUpdatesDatabase *database;
@property (nonatomic, readonly) id<ABI41_0_0EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) ABI41_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@interface ABI41_0_0EXUpdatesService : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0EXUpdatesInterface>

@end

NS_ASSUME_NONNULL_END
