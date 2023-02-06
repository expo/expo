// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesConfig.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesSelectionPolicy.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesService.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI48_0_0EXUpdatesBindingDelegate

- (ABI48_0_0EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (ABI48_0_0EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable ABI48_0_0EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(ABI48_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI48_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI48_0_0EXUpdatesDatabase *database;

@end

@interface ABI48_0_0EXUpdatesBinding : ABI48_0_0EXUpdatesService <ABI48_0_0EXInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI48_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI48_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
