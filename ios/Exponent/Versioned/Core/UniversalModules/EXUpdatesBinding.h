// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesService.h>
#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesBindingDelegate

- (EXUpdatesConfig *)configForExperienceId:(NSString *)experienceId;
- (EXUpdatesSelectionPolicy *)selectionPolicyForExperienceId:(NSString *)experienceId;
- (nullable EXUpdatesUpdate *)launchedUpdateForExperienceId:(NSString *)experienceId;
- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId;
- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId;
- (BOOL)isStartedForExperienceId:(NSString *)experienceId;
- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId;
- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) EXUpdatesDatabase *database;

@end

@interface EXUpdatesBinding : EXUpdatesService <UMInternalModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
