// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXUpdates.h"
#import <React/RCTUIManager.h>
#import <React/RCTBridge.h>

NSString * const EXUpdatesEventName = @"Exponent.nativeUpdatesEvent";
NSString * const EXUpdatesErrorEventType = @"error";
NSString * const EXUpdatesNotAvailableEventType = @"noUpdateAvailable";
NSString * const EXUpdatesDownloadStartEventType = @"downloadStart";
NSString * const EXUpdatesDownloadProgressEventType = @"downloadProgress";
NSString * const EXUpdatesDownloadFinishedEventType = @"downloadFinished";

EX_DEFINE_SCOPED_MODULE_GETTER(EXUpdates, updates)

@interface EXUpdates ()

@property (nonatomic, strong) NSDictionary *manifest;

@property (nonatomic, weak) id kernelUpdatesServiceDelegate;

@end

@implementation EXUpdates

@synthesize bridge = _bridge;

EX_EXPORT_SCOPED_MODULE(ExponentUpdates, UpdatesManager)

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
  [_bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXUpdatesEventName, body]];
}

RCT_EXPORT_METHOD(reload)
{
  [_kernelUpdatesServiceDelegate updatesModuleDidSelectReload:self];
}

RCT_EXPORT_METHOD(reloadFromCache)
{
  [_kernelUpdatesServiceDelegate updatesModuleDidSelectReloadFromCache:self];
}

RCT_EXPORT_METHOD(checkForUpdateAsync:(RCTPromiseResolveBlock)resolve
                             rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _areDevToolsEnabledWithManifest:_manifest]) {
    reject(@"E_CHECK_UPDATE_FAILED", @"Cannot check for updates in dev mode", nil);
    return;
  }
  [_kernelUpdatesServiceDelegate updatesModule:self didRequestManifestWithCacheBehavior:EXCachedResourceNoCache success:^(NSDictionary * _Nonnull manifest) {
    NSString *currentRevisionId = _manifest[@"revisionId"];
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

RCT_EXPORT_METHOD(fetchUpdateAsync:(RCTPromiseResolveBlock)resolve
                          rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([self _areDevToolsEnabledWithManifest:_manifest]) {
    [self sendEventWithBody:@{
                               @"type": EXUpdatesErrorEventType,
                               @"message": @"Cannot fetch updates in dev mode"
                               }];
    reject(@"E_FETCH_UPDATE_FAILED", @"Cannot fetch updates in dev mode", nil);
    return;
  }
  [_kernelUpdatesServiceDelegate updatesModule:self didRequestManifestWithCacheBehavior:EXCachedResourceWriteToCache success:^(NSDictionary * _Nonnull manifest) {
    NSString *currentRevisionId = _manifest[@"revisionId"];
    NSString *newRevisionId = manifest[@"revisionId"];
    if (currentRevisionId && newRevisionId && [currentRevisionId isEqualToString:newRevisionId]) {
      [self sendEventWithBody:@{ @"type": EXUpdatesNotAvailableEventType }];
      resolve(nil);
      return;
    }
    
    if ([_manifest[@"bundleUrl"] isEqualToString:manifest[@"bundleUrl"]]) {
      [self sendEventWithBody:@{ @"type": EXUpdatesNotAvailableEventType }];
      resolve(nil);
      return;
    }

    void (^progressBlock)(NSDictionary * _Nonnull) = ^void(NSDictionary * _Nonnull progressDict) {
      NSMutableDictionary *eventBody = [progressDict mutableCopy];
      eventBody[@"type"] = EXUpdatesDownloadProgressEventType;
      [self sendEventWithBody:eventBody];
    };
    void (^successBlock)(NSData * _Nonnull) = ^void(NSData * _Nonnull data) {
      [self sendEventWithBody:@{
                                 @"type": EXUpdatesDownloadFinishedEventType,
                                 @"manifest": manifest
                                 }];
      resolve(manifest);
    };
    void (^errorBlock)(NSError * _Nonnull) = ^void(NSError * _Nonnull error) {
      [self sendEventWithBody:@{
                                 @"type": EXUpdatesErrorEventType,
                                 @"message": @"Failed to fetch new update"
                                 }];
      reject(@"E_FETCH_BUNDLE_FAILED", @"Failed to fetch new update", error);
    };

    [self sendEventWithBody:@{ @"type": EXUpdatesDownloadStartEventType }];
    [_kernelUpdatesServiceDelegate updatesModule:self
                    didRequestBundleWithManifest:manifest
                                        progress:progressBlock
                                         success:successBlock
                                         failure:errorBlock];
  } failure:^(NSError * _Nonnull error) {
    [self sendEventWithBody:@{
                               @"type": EXUpdatesErrorEventType,
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
