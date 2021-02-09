// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <UMCore/UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXUpdatesAppRelaunchCompletionBlock)(BOOL success);

@protocol EXUpdatesInterface

@property (nonatomic, readonly) EXUpdatesConfig *config;
@property (nonatomic, readonly) EXUpdatesDatabase *database;
@property (nonatomic, readonly) id<EXUpdatesSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly) NSURL *directory;

@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nonatomic, readonly, assign) BOOL canRelaunch;

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@interface EXUpdatesService : NSObject <UMInternalModule, EXUpdatesInterface>

@end

NS_ASSUME_NONNULL_END
