//
//  EXOtaPersistance.m
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import "EXOtaPersistance.h"

static NSString * const manifestKey = @"manifest";
static NSString * const bundlePathKey = @"bundlePath";
static NSString * const downloadedManifestKey = @"downloadedManifest";
static NSString * const downloadedBundlePathKey = @"downloadedBundlePath";
static NSString * const outdatedBundlePathKey = @"outdatedBundlePath";
static NSString * const enqueueReorderKey = @"enqueueReorder";

@implementation EXOtaPersistance

EXKeyValueStorage *_storage;
NSString *_appId;

@synthesize config = _config;
@synthesize appId = _appId;

- (id)initWithStorage:(EXKeyValueStorage *)storage
{
  _storage = storage;
  return self;
}

- (void)storeManifest:(NSDictionary *)manifest
{
  [self storeOrRemoveValue:manifest forKey:manifestKey];
}

- (void)storeBundle:(NSString *)bundlePath
{
  [self storeOrRemoveString:bundlePath forKey:bundlePathKey];
}

- (void)storeDownloadedManifest:(nullable NSDictionary *)manifest
{
  [self storeOrRemoveValue:manifest forKey:downloadedManifestKey];
}

- (void)storeDownloadedBundle:(nullable NSString *)bundlePath
{
  [self storeOrRemoveString:bundlePath forKey:downloadedBundlePathKey];
}

- (void)storeOutdatedBundle:(nullable NSString *)bundlePath
{
  [self storeOrRemoveString:bundlePath forKey:outdatedBundlePathKey];
}

- (void)storeOrRemoveValue:(nullable NSObject *)object forKey:(NSString *)key
{
  if(object != nil)
  {
    [_storage persistObject:object forKey:key];
  } else
  {
    [_storage removeValueForKey:key];
  }
}

- (void)storeOrRemoveString:(nullable NSString *)value forKey:(NSString *)key
{
  if(value != nil)
  {
    [_storage persistString:value forKey:key];
  } else
  {
    [_storage removeValueForKey:key];
  }
}

- (void)markDownloadedCurrentAndCurrentOutdated
{
  NSDictionary *downloadedManifest = [self readDownloadedManifest];
  NSString *downloadedBundle = [self readDownloadedBundlePath];
  if(downloadedManifest != nil && downloadedBundle != nil)
  {
    [self storeOutdatedBundle:[self readBundlePath]];
    [self storeManifest:downloadedManifest];
    [self storeBundle:downloadedBundle];
    [self storeDownloadedBundle:nil];
    [self storeDownloadedManifest:nil];
  }
}

- (void)enqueueReorderAtNextBoot
{
  [_storage persistBool:YES forKey:enqueueReorderKey];
}

- (void)dequeueReorderAtNextBoot
{
  [_storage persistBool:NO forKey:enqueueReorderKey];
}

- (BOOL)isReorderAtNextBootEnqueued
{
  return [_storage readBool:enqueueReorderKey];
}

- (NSDictionary *)readNewestManifest
{
  NSDictionary *downloadedManifest = [self readDownloadedManifest];
  if(downloadedManifest == nil)
  {
    return [self readManifest];
  } else
  {
    return downloadedManifest;
  }
}

- (nullable NSDictionary *)readManifest
{
  return [_storage readObject:manifestKey];
}

- (NSString *)readBundlePath
{
  return [_storage readStringForKey:bundlePathKey];
}

- (NSDictionary *)readDownloadedManifest
{
  return [_storage readObject:downloadedManifestKey];
}

- (NSString *)readDownloadedBundlePath
{
  return [_storage readStringForKey:downloadedBundlePathKey];
}

- (NSString *)readOutdatedBundlePath
{
  return [_storage readStringForKey:outdatedBundlePathKey];
}

- (void)clean
{
  [_storage removeValueForKey:@"manifest"];
  [_storage removeValueForKey:@"bundlePath"];
  [_storage removeValueForKey:@"downloadedManifest"];
  [_storage removeValueForKey:@"downloadedBundlePath"];
  [_storage removeValueForKey:@"outdatedBundlePath"];
  [_storage removeValueForKey:@"enqueueReorder"];
}

@end
