// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXUpdates/ABI49_0_0EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>
#import <ABI49_0_0EXUpdates/ABI49_0_0EXUpdatesService.h>

@class ABI49_0_0EXUpdatesConfig;
@class ABI49_0_0EXUpdatesUpdate;
@class ABI49_0_0EXUpdatesSelectionPolicy;
@class ABI49_0_0EXUpdatesDatabase;

NS_ASSUME_NONNULL_BEGIN

@protocol ABI49_0_0EXUpdatesBindingDelegate

- (nullable ABI49_0_0EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (nullable ABI49_0_0EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable ABI49_0_0EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(ABI49_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI49_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI49_0_0EXUpdatesDatabase *database;

@end

@interface ABI49_0_0EXUpdatesBinding : ABI49_0_0EXUpdatesService <ABI49_0_0EXInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI49_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI49_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
