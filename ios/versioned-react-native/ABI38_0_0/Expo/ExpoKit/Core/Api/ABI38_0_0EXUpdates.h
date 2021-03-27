// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXResourceLoader.h"
#import "ABI38_0_0EXScopedBridgeModule.h"
#import "ABI38_0_0EXScopedModuleRegistry.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncEventName;
FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncErrorEventType;
FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncNotAvailableEventType;
FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncDownloadStartEventType;
FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncDownloadProgressEventType;
FOUNDATION_EXPORT NSString * const ABI38_0_0EXSyncDownloadFinishedEventType;

@protocol ABI38_0_0EXSyncScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedModule;
- (void)updatesModuleDidSelectReloadFromCache:(id)scopedModule;
- (void)updatesModule:(id)scopedModule
didRequestManifestWithCacheBehavior:(ABI38_0_0EXManifestCacheBehavior)cacheBehavior
              success:(void (^)(NSDictionary * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure;
- (void)updatesModule:(id)scopedModule
didRequestBundleWithCompletionQueue:(dispatch_queue_t)completionQueue
                start:(void (^)(void))startBlock
              success:(void (^)(NSDictionary * _Nullable))success
              failure:(void (^)(NSError * _Nonnull))failure;

@end

@interface ABI38_0_0EXUpdates : ABI38_0_0EXScopedBridgeModule

- (void)sendEventWithBody:(NSDictionary *)body;

@end

ABI38_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI38_0_0EXUpdates, updates)

NS_ASSUME_NONNULL_END
