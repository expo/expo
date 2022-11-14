// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <ExpoModulesCore/EXInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol EXUpdatesModuleInterface

@property (nonatomic, readonly) EXUpdatesConfig *config;
@property (nonatomic, readonly) EXUpdatesDatabase *database;
@property (nonatomic, readonly) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *embeddedUpdate;
@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isEmbeddedLaunch;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;
- (void)resetSelectionPolicy;

@end

@interface EXUpdatesService : NSObject <EXInternalModule, EXUpdatesModuleInterface>

@end

NS_ASSUME_NONNULL_END
