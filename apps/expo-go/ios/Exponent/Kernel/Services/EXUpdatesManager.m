// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader+Updates.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXUpdatesManager.h"

#import <React/RCTBridge.h>

@import EXManifests;
@import EXUpdates;

NSString * const EXUpdatesEventName = @"Expo.nativeUpdatesEvent";
NSString * const EXUpdatesErrorEventType = @"error";
NSString * const EXUpdatesUpdateAvailableEventType = @"updateAvailable";
NSString * const EXUpdatesNotAvailableEventType = @"noUpdateAvailable";

@implementation EXUpdatesManager

- (void)notifyApp:(EXKernelAppRecord *)appRecord
ofDownloadWithManifest:(EXManifestsManifest * _Nullable)manifest
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
    // prevent a crash, but this shouldn't ever happen
    NSDictionary *rawManifestJSON = manifest ? manifest.rawManifestJSON : @{};
    body = @{
             @"type": EXUpdatesUpdateAvailableEventType,
             @"manifest": rawManifestJSON
             };
  } else {
    body = @{
             @"type": EXUpdatesNotAvailableEventType
             };
  }
  if (appRecord.status == kEXKernelAppRecordStatusRunning) {
    RCTEventDispatcher *dispatcher = [[appRecord.appManager.reactHost moduleRegistry] moduleForName:"EventDispatcher"];
    [dispatcher sendAppEventWithName:EXUpdatesEventName body:@[EXUpdatesEventName, body]];
  }
}

# pragma mark - internal

- (EXAbstractLoader *)_appLoaderWithScopeKey:(NSString *)scopeKey
{
  EXKernelAppRecord *appRecord = [[EXKernel sharedInstance].appRegistry newestRecordWithScopeKey:scopeKey];
  return appRecord.appLoader;
}

# pragma mark - EXUpdatesBindingDelegate

- (nullable EXUpdatesConfig *)configForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].config;
}

- (nullable EXUpdatesSelectionPolicy *)selectionPolicyForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].selectionPolicy;
}

- (nullable nullable EXUpdatesUpdate *)launchedUpdateForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher.launchedUpdate;
}

- (nullable NSNumber *)launchDurationForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].launchDuration;
}

- (nullable NSDictionary *)assetFilesMapForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssetsForScopeKey:(NSString *)scopeKey
{
  return NO;
}

- (BOOL)isStartedForScopeKey:(NSString *)scopeKey
{
  return [self _appLoaderWithScopeKey:scopeKey].appLauncher != nil;
}

- (void)requestRelaunchForScopeKey:(NSString *)scopeKey withCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  [[EXKernel sharedInstance] reloadAppFromCacheWithScopeKey:scopeKey];
  completion(YES);
}

@end
