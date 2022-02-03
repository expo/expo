// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesSelectionPolicy.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesService.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI44_0_0EXUpdatesBindingDelegate

- (ABI44_0_0EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (ABI44_0_0EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable ABI44_0_0EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(ABI44_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol ABI44_0_0EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) ABI44_0_0EXUpdatesDatabase *database;

@end

@interface ABI44_0_0EXUpdatesBinding : ABI44_0_0EXUpdatesService <ABI44_0_0EXInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<ABI44_0_0EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<ABI44_0_0EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
