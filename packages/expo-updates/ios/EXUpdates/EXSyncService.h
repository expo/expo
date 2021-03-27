// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>
#import <EXUpdates/EXSyncManifest.h>
#import <UMCore/UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXSyncRelaunchCompletionBlock)(BOOL success);

@protocol EXSyncInterface

@property (nonatomic, readonly) EXSyncConfig *config;
@property (nonatomic, readonly) EXSyncDatabase *database;
@property (nonatomic, readonly) id<EXSyncSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) EXSyncManifest *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(EXSyncRelaunchCompletionBlock)completion;

@end

@interface EXSyncService : NSObject <UMInternalModule, EXSyncInterface>

@end

NS_ASSUME_NONNULL_END
