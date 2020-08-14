// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI38_0_0EXUpdates.h"
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>

NSString * const ABI38_0_0EXUpdatesEventName = @"Exponent.nativeUpdatesEvent";
NSString * const ABI38_0_0EXUpdatesErrorEventType = @"error";
NSString * const ABI38_0_0EXUpdatesNotAvailableEventType = @"noUpdateAvailable";
NSString * const ABI38_0_0EXUpdatesDownloadStartEventType = @"downloadStart";
NSString * const ABI38_0_0EXUpdatesDownloadProgressEventType = @"downloadProgress";
NSString * const ABI38_0_0EXUpdatesDownloadFinishedEventType = @"downloadFinished";

ABI38_0_0EX_DEFINE_SCOPED_MODULE_GETTER(ABI38_0_0EXUpdates, updates)

@interface ABI38_0_0EXUpdates ()

@property (nonatomic, strong) NSDictionary *manifest;

@property (nonatomic, weak) id kernelUpdatesServiceDelegate;

@end

@implementation ABI38_0_0EXUpdates

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

ABI38_0_0EX_EXPORT_SCOPED_MODULE(ExponentUpdates, UpdatesManager)

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelUpdatesServiceDelegate = kernelServiceInstance;
    _manifest = params[@"manifest"];
  }
  return self;
}

- (void)sendEventWithBody:(NSDictionary *)body
{
  [_bridge enqueueJSCall:@"ABI38_0_0RCTDeviceEventEmitter.emit" args:@[ABI38_0_0EXUpdatesEventName, body]];
}

ABI38_0_0RCT_EXPORT_METHOD(reload)
{
  [_kernelUpdatesServiceDelegate updatesModuleDidSelectReload:self];
}

ABI38_0_0RCT_EXPORT_METHOD(reloadFromCache)
{
  [_kernelUpdatesServiceDelegate updatesModuleDidSelectReloadFromCache:self];
}

ABI38_0_0RCT_EXPORT_METHOD(checkForUpdateAsync:(ABI38_0_0RCTPromiseResolveBlock)resolve
                             rejecter:(ABI38_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _areDevToolsEnabledWithManifest:_manifest]) {
    reject(@"E_CHECK_UPDATE_FAILED", @"Cannot check for updates in dev mode", nil);
    return;
  }
  [_kernelUpdatesServiceDelegate updatesModule:self didRequestManifestWithCacheBehavior:ABI38_0_0EXManifestNoCache success:^(NSDictionary * _Nonnull manifest) {
    NSString *currentRevisionId = self->_manifest[@"revisionId"];
    NSString *newRevisionId = manifest[@"revisionId"];
    if (!currentRevisionId || !newRevisionId) {
      reject(@"E_CHECK_UPDATE_FAILED", @"Revision ID not found in manifest", nil);
      return;
    }
    if ([currentRevisionId isEqualToString:newRevisionId]) {
      resolve(nil);
      return;
    }
    resolve(manifest);
  } failure:^(NSError * _Nonnull error) {
    reject(@"E_CHECK_UPDATE_FAILED", error.localizedDescription, error);
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(fetchUpdateAsync:(ABI38_0_0RCTPromiseResolveBlock)resolve
                          rejecter:(ABI38_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _areDevToolsEnabledWithManifest:_manifest]) {
    [self sendEventWithBody:@{
                               @"type": ABI38_0_0EXUpdatesErrorEventType,
                               @"message": @"Cannot fetch updates in dev mode"
                               }];
    reject(@"E_FETCH_UPDATE_FAILED", @"Cannot fetch updates in dev mode", nil);
    return;
  }
  [_kernelUpdatesServiceDelegate updatesModule:self didRequestBundleWithCompletionQueue:_methodQueue start:^{
    [self sendEventWithBody:@{ @"type": ABI38_0_0EXUpdatesDownloadStartEventType }];
  } success:^(NSDictionary * _Nullable manifest) {
    if (manifest) {
      [self sendEventWithBody:@{
        @"type": ABI38_0_0EXUpdatesDownloadFinishedEventType,
        @"manifest": manifest
      }];
      resolve(manifest);
    } else {
      [self sendEventWithBody:@{ @"type": ABI38_0_0EXUpdatesNotAvailableEventType }];
      resolve(nil);
    }
  } failure:^(NSError * _Nonnull error) {
    [self sendEventWithBody:@{
      @"type": ABI38_0_0EXUpdatesErrorEventType,
      @"message": error.localizedDescription
    }];
    reject(@"E_CHECK_UPDATE_FAILED", error.localizedDescription, error);
  }];
}

- (BOOL)_areDevToolsEnabledWithManifest:(NSDictionary *)manifest
{
  NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
}

@end
