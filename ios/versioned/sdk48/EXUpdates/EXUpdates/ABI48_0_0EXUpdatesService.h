// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesSelectionPolicy.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ABI48_0_0EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol ABI48_0_0EXUpdatesModuleInterface

@property (nonatomic, readonly) ABI48_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly) ABI48_0_0EXUpdatesDatabase *database;
@property (nonatomic, readonly) ABI48_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) ABI48_0_0EXUpdatesUpdate *embeddedUpdate;
@property (nullable, nonatomic, readonly, strong) ABI48_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isEmbeddedLaunch;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(ABI48_0_0EXUpdatesAppRelaunchCompletionBlock)completion;
- (void)resetSelectionPolicy;

@end

@interface ABI48_0_0EXUpdatesService : NSObject <ABI48_0_0EXInternalModule, ABI48_0_0EXUpdatesModuleInterface>

@end

NS_ASSUME_NONNULL_END
