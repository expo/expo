// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXUpdates/ABI41_0_0EXSyncService.h>)
#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicy.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncService.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI41_0_0EXSyncBindingDelegate

- (ABI41_0_0EXSyncConfig *)configForExperienceId:(NSString *)experienceId;
- (id<ABI41_0_0EXSyncSelectionPolicy>)selectionPolicyForExperienceId:(NSString *)experienceId;
- (nullable ABI41_0_0EXSyncManifest *)launchedUpdateForExperienceId:(NSString *)experienceId;
- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId;
- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId;
- (BOOL)isStartedForExperienceId:(NSString *)experienceId;
- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId;
- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(ABI41_0_0EXSyncRelaunchCompletionBlock)completion;

@end

@protocol ABI41_0_0EXSyncDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI41_0_0EXSyncDatabase *database;

@end

@interface ABI41_0_0EXSyncBinding : ABI41_0_0EXSyncService <ABI41_0_0UMInternalModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<ABI41_0_0EXSyncBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI41_0_0EXSyncDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
