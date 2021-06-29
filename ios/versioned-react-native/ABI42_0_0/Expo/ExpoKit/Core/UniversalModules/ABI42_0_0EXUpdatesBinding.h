// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesSelectionPolicy.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesService.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXUpdatesBindingDelegate

- (ABI42_0_0EXUpdatesConfig *)configForExperienceId:(NSString *)experienceId;
- (ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicyForExperienceId:(NSString *)experienceId;
- (nullable ABI42_0_0EXUpdatesUpdate *)launchedUpdateForExperienceId:(NSString *)experienceId;
- (nullable NSDictionary *)assetFilesMapForExperienceId:(NSString *)experienceId;
- (BOOL)isUsingEmbeddedAssetsForExperienceId:(NSString *)experienceId;
- (BOOL)isStartedForExperienceId:(NSString *)experienceId;
- (BOOL)isEmergencyLaunchForExperienceId:(NSString *)experienceId;
- (void)requestRelaunchForExperienceId:(NSString *)experienceId withCompletion:(ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI42_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI42_0_0EXUpdatesDatabase *database;

@end

@interface ABI42_0_0EXUpdatesBinding : ABI42_0_0EXUpdatesService <ABI42_0_0UMInternalModule>

- (instancetype)initWithExperienceId:(NSString *)experienceId updatesKernelService:(id<ABI42_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI42_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
