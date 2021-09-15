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

- (ABI42_0_0EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (ABI42_0_0EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable ABI42_0_0EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(ABI42_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI42_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI42_0_0EXUpdatesDatabase *database;

@end

@interface ABI42_0_0EXUpdatesBinding : ABI42_0_0EXUpdatesService <ABI42_0_0UMInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI42_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI42_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
