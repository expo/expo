// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXSyncService.h>)
#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <EXUpdates/EXSyncConfig.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncSelectionPolicy.h>
#import <EXUpdates/EXSyncService.h>
#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXSyncBindingDelegate

- (EXSyncConfig *)configForExperienceId:(NSString *)experienceId;
- (id<EXSyncSelectionPolicy>)selectionPolicyForExperienceId:(NSString *)experienceId;
- (nullable EXSyncManifest *)launchedUpdateForExperienceId:(NSString *)experienceId;
- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId;
- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId;
- (BOOL)isStartedForExperienceId:(NSString *)experienceId;
- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId;
- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(EXSyncRelaunchCompletionBlock)completion;

@end

@protocol EXSyncDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) EXSyncDatabase *database;

@end

@interface EXSyncBinding : EXSyncService <UMInternalModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<EXSyncBindingDelegate>)updatesKernelService databaseKernelService:(id<EXSyncDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
