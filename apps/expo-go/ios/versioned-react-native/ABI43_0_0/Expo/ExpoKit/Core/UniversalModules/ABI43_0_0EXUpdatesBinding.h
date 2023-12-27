// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesSelectionPolicy.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesService.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI43_0_0EXUpdatesBindingDelegate

- (ABI43_0_0EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (ABI43_0_0EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable ABI43_0_0EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(ABI43_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI43_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI43_0_0EXUpdatesDatabase *database;

@end

@interface ABI43_0_0EXUpdatesBinding : ABI43_0_0EXUpdatesService <ABI43_0_0EXInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI43_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI43_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
