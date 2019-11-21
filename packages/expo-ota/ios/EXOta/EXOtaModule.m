// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMEventEmitterService.h>
#import "EXOtaModule.h"
#import "EXKeyValueStorage.h"
#import "EXOtaPersistance.h"
#import "EXOtaPersistanceFactory.h"
#import "EXOtaEvents.h"
#import "EXOtaUpdaterFactory.h"
#import "EXOtaUpdater.h"
#import "EXExpoUpdatesConfig.h"
#import "EXEmbeddedManifestAndBundle.h"

@interface EXOtaModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@end

@implementation EXOtaModule {
  EXOtaUpdater *updater;
  EXOtaPersistance *persistance;
  NSString *appId;
  EXOtaEvents *events;
}

UM_EXPORT_MODULE(ExpoOta);

- (id)init
{
  return [self configure:@"defaultId"];
}

- (id)initWithId:(NSString *)appId
{
  return [self configure:appId];
}

- (id)configure:(NSString * _Nullable)appId
{
  self->appId = appId;
  persistance = [[EXOtaPersistanceFactory sharedFactory] persistanceForId:appId createIfNeeded:NO];
  if(persistance != nil) {
    updater = [[EXOtaUpdaterFactory sharedFactory] updaterForId:appId initWithConfig:persistance.config withPersistance:persistance];
  } else {
    updater = nil;
  }
  return self;
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
  events = [[EXOtaEvents alloc] initWithEmitter:_eventEmitter];
  updater.eventsEmitter = events;
}

UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if(updater != nil) {
    [updater downloadManifest:^(NSDictionary * _Nonnull manifest) {
      if([self isManifestNewer:manifest])
      {
        resolve(manifest);
      } else
      {
        resolve(@NO);
      }
    } error:^(NSError * _Nonnull error) {
      reject(@"ERR_EXPO_OTA", @"Could not download manifest", error);
    }];
  } else {
    reject(@"ERR_EXPO_OTA", @"Expo-updates not initialized!", nil);
  }
}

- (BOOL) isManifestNewer:(NSDictionary * _Nonnull)manifest
{
  return [persistance.config.manifestComparator shouldReplaceBundle:[persistance readNewestManifest] forNew:manifest];
}

UM_EXPORT_METHOD_AS(fetchUpdateAsync,
                    fetchUpdateAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if(updater != nil) {
    [updater checkAndDownloadUpdate:^(NSDictionary * _Nonnull manifest, NSString * _Nonnull filePath) {
      [self->updater saveDownloadedManifest:manifest andBundlePath:filePath];
      resolve(@{
        @"manifest": manifest
      });
    } updateUnavailable:^{
      resolve(nil);
    }   error:^(NSError * _Nonnull error) {
      reject(@"ERR_EXPO_OTA", @"Could not download update", error);
    }];
  } else {
    reject(@"ERR_EXPO_OTA", @"Expo-updates not initialized!", nil);
  }
}

UM_EXPORT_METHOD_AS(clearUpdateCacheAsync,
                    clearUpdateCacheAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if(updater != nil) {
    [updater cleanUnusedFiles];
    resolve(@YES);
  } else {
    reject(@"ERR_EXPO_OTA", @"Expo-updates not initialized!", nil);
  }
}

UM_EXPORT_METHOD_AS(reload,
                    reload:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if(updater != nil) {
    [updater scheduleForExchangeAtNextBoot];
    resolve(@YES);
  } else {
    reject(@"ERR_EXPO_OTA", @"Expo-updates not initialized!", nil);
  }
}

UM_EXPORT_METHOD_AS(readCurrentManifestAsync,
                    readCurrentManifestAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if(updater != nil) {
    resolve([[EXEmbeddedManifestAndBundle alloc] readManifest]);
  } else {
    reject(@"ERR_EXPO_OTA", @"Expo-updates not initialized!", nil);
  }
}

# pragma mark - UMEventEmitter

- (NSArray<NSString *> *)supportedEvents
{
  return [events supportedEvents];
}

- (void)startObserving {}


- (void)stopObserving {}

@end
