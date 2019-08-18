// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXResourceLoader.h"
#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXUpdatesEventName;
FOUNDATION_EXPORT NSString * const EXUpdatesErrorEventType;
FOUNDATION_EXPORT NSString * const EXUpdatesNotAvailableEventType;
FOUNDATION_EXPORT NSString * const EXUpdatesDownloadStartEventType;
FOUNDATION_EXPORT NSString * const EXUpdatesDownloadProgressEventType;
FOUNDATION_EXPORT NSString * const EXUpdatesDownloadFinishedEventType;

@protocol EXUpdatesScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedModule;
- (void)updatesModuleDidSelectReloadFromCache:(id)scopedModule;
- (void)updatesModule:(id)scopedModule
didRequestManifestWithCacheBehavior:(EXManifestCacheBehavior)cacheBehavior
              success:(void (^)(NSDictionary * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure;
- (void)updatesModule:(id)scopedModule
didRequestBundleWithManifest:(NSDictionary *)manifest
             progress:(void (^)(NSDictionary * _Nonnull))progress
              success:(void (^)(NSData * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure;

@end

@interface EXUpdates : EXScopedBridgeModule

- (void)sendEventWithBody:(NSDictionary *)body;

@end

EX_DECLARE_SCOPED_MODULE_GETTER(EXUpdates, updates)

NS_ASSUME_NONNULL_END
