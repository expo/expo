// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol ABI42_0_0EXUpdatesModuleInterface

@property (nonatomic, readonly) ABI42_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly) ABI42_0_0EXUpdatesDatabase *database;
@property (nonatomic, readonly) ABI42_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) ABI42_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)completion;
- (void)resetSelectionPolicy;

@end

@interface ABI42_0_0EXUpdatesService : NSObject <ABI42_0_0UMInternalModule, ABI42_0_0EXUpdatesModuleInterface>

@end

NS_ASSUME_NONNULL_END
