// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI39_0_0EXUpdates/ABI39_0_0EXSyncService.h>)
#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncDatabase.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncSelectionPolicy.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncService.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXSyncBindingDelegate

- (ABI39_0_0EXSyncConfig *)configForExperienceId:(NSString *)experienceId;
- (id<ABI39_0_0EXSyncSelectionPolicy>)selectionPolicyForExperienceId:(NSString *)experienceId;
- (nullable ABI39_0_0EXSyncManifest *)launchedUpdateForExperienceId:(NSString *)experienceId;
- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId;
- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId;
- (BOOL)isStartedForExperienceId:(NSString *)experienceId;
- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId;
- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(ABI39_0_0EXSyncRelaunchCompletionBlock)completion;

@end

@protocol ABI39_0_0EXSyncDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI39_0_0EXSyncDatabase *database;

@end

@interface ABI39_0_0EXSyncBinding : ABI39_0_0EXSyncService <ABI39_0_0UMInternalModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<ABI39_0_0EXSyncBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI39_0_0EXSyncDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
