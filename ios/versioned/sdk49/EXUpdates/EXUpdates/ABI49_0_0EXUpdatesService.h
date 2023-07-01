// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>

@class ABI49_0_0EXUpdatesConfig;
@class ABI49_0_0EXUpdatesUpdate;
@class ABI49_0_0EXUpdatesSelectionPolicy;
@class ABI49_0_0EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI49_0_0EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol ABI49_0_0EXUpdatesModuleInterface

@property (nonatomic, readonly, nullable) ABI49_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly) ABI49_0_0EXUpdatesDatabase *database;
@property (nonatomic, readonly, nullable) ABI49_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) ABI49_0_0EXUpdatesUpdate *embeddedUpdate;
@property (nullable, nonatomic, readonly, strong) ABI49_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isEmbeddedLaunch;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;
@property (nonatomic, readonly, assign) BOOL canCheckForUpdateAndFetchUpdate;

- (void)requestRelaunchWithCompletion:(ABI49_0_0EXUpdatesAppRelaunchCompletionBlock)completion;
- (void)resetSelectionPolicy;

@end

@interface ABI49_0_0EXUpdatesService : NSObject <ABI49_0_0EXInternalModule, ABI49_0_0EXUpdatesModuleInterface>

@end

NS_ASSUME_NONNULL_END
