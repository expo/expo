// Copyright 2020-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXInternalModule.h>

@class EXUpdatesConfig;
@class EXUpdatesUpdate;
@class EXUpdatesSelectionPolicy;
@class EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol EXUpdatesModuleInterface

@property (nonatomic, readonly, nullable) EXUpdatesConfig *config;
@property (nonatomic, readonly) EXUpdatesDatabase *database;
@property (nonatomic, readonly, nullable) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *embeddedUpdate;
@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isEmbeddedLaunch;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;
@property (nonatomic, readonly, assign) BOOL canCheckForUpdateAndFetchUpdate;

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;
- (void)resetSelectionPolicy;

@end

@interface EXUpdatesService : NSObject <EXInternalModule, EXUpdatesModuleInterface>

@end

NS_ASSUME_NONNULL_END
