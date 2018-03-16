// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXKernelAppLoader+Updates.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXScopedModuleRegistry.h"
#import "EXShellManager.h"
#import "EXUpdates.h"
#import "EXUpdatesManager.h"
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

@interface EXUpdatesManager ()

@property (nonatomic, strong) EXKernelAppLoader *appLoader;

@end

@implementation EXUpdatesManager

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(NSDictionary * _Nullable)manifest
            isNew:(BOOL)isBundleNew
            error:(NSError * _Nullable)error;
{
  NSDictionary *body;
  if (error) {
    body = @{
             @"type": EXUpdatesErrorEventType,
             @"message": error.localizedDescription
             };
  } else if (isBundleNew) {
    body = @{
             @"type": EXUpdatesDownloadFinishedEventType,
             @"manifest": manifest
             };
  } else {
    body = @{
             @"type": EXUpdatesNotAvailableEventType
             };
  }
  if (appRecord.status == kEXKernelAppRecordStatusRunning) {
    RCTBridge *bridge = appRecord.appManager.reactBridge;
    [bridge.scopedModules.updates sendEventWithBody:body];
  }
}

# pragma mark - internal

- (EXKernelAppLoader *)_appLoaderWithScopedModule:(id)scopedModule
{
  NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance].appRegistry newestRecordWithExperienceId:experienceId];
  return appRecord.appLoader;
}

# pragma mark - EXUpdatesScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedModule
{
  NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
  [[EXKernel sharedInstance] reloadAppWithExperienceId:experienceId];
}

- (void)updatesModule:(id)scopedModule
didRequestManifestWithCacheBehavior:(EXCachedResourceBehavior)cacheBehavior
              success:(void (^)(NSDictionary * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure
{
  if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].areRemoteUpdatesEnabled) {
    failure(RCTErrorWithMessage(@"Remote updates are disabled in app.json"));
    return;
  }
  EXKernelAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];
  [appLoader fetchManifestWithCacheBehavior:cacheBehavior success:success failure:failure];
}

- (void)updatesModule:(id)scopedModule
didRequestBundleWithManifest:(NSDictionary *)manifest
             progress:(void (^)(NSDictionary * _Nonnull))progressBlock
              success:(void (^)(NSData * _Nonnull))success
              failure:(void (^)(NSError * _Nonnull))failure
{
  if ([EXShellManager sharedInstance].isShell && ![EXShellManager sharedInstance].areRemoteUpdatesEnabled) {
    failure(RCTErrorWithMessage(@"Remote updates are disabled in app.json"));
    return;
  }
  void (^progressDictBlock)(EXLoadingProgress * _Nonnull) = ^void(EXLoadingProgress * _Nonnull progress) {
    progressBlock(@{
                    @"status": progress.status,
                    @"done": progress.done,
                    @"total": progress.total
                    });
  };
  EXKernelAppLoader *appLoader = [self _appLoaderWithScopedModule:scopedModule];
  [appLoader fetchJSBundleWithManifest:manifest
                         cacheBehavior:EXCachedResourceWriteToCache
                       timeoutInterval:kEXJSBundleTimeout
                              progress:progressDictBlock
                               success:success
                                 error:failure];
}

@end
