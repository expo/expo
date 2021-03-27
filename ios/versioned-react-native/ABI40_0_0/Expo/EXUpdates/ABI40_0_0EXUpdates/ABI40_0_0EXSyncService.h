// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncSelectionPolicy.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI40_0_0EXSyncRelaunchCompletionBlock)(BOOL success);

@protocol ABI40_0_0EXSyncInterface

@property (nonatomic, readonly) ABI40_0_0EXSyncConfig *config;
@property (nonatomic, readonly) ABI40_0_0EXSyncDatabase *database;
@property (nonatomic, readonly) id<ABI40_0_0EXSyncSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) ABI40_0_0EXSyncManifest *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(ABI40_0_0EXSyncRelaunchCompletionBlock)completion;

@end

@interface ABI40_0_0EXSyncService : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0EXSyncInterface>

@end

NS_ASSUME_NONNULL_END
