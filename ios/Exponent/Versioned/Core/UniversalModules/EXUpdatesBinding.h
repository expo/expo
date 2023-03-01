// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXUpdates/EXUpdatesService.h>)
#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXInternalModule.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesService.h>

@class EXUpdatesConfig;
@class EXUpdatesUpdate;
@class EXUpdatesSelectionPolicy;

NS_ASSUME_NONNULL_BEGIN

@protocol EXUpdatesBindingDelegate

- (EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey;
- (EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey;
- (nullable EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey;
- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey;
- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey;
- (BOOL)isStartedForScopeKey:(NSString *)scopeKey;
- (BOOL)isEmergencyLaunchForScopeKey:(NSString *)scopeKey;
- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;

@end

@protocol EXUpdatesDatabaseBindingDelegate

@property (nonatomic, strong, readonly) NSURL *updatesDirectory;
@property (nonatomic, strong, readonly) EXUpdatesDatabase *database;

@end

@interface EXUpdatesBinding : EXUpdatesService <EXInternalModule>

- (instancetype)initWithScopeKey:(NSString *)scopeKey updatesKernelService:(id<EXUpdatesBindingDelegate>)updatesKernelService databaseKernelService:(id<EXUpdatesDatabaseBindingDelegate>)databaseKernelService;

@end

NS_ASSUME_NONNULL_END

#endif
