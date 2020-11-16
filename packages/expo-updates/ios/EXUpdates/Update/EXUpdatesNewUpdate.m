//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesNewUpdate

+ (EXUpdatesUpdate *)updateWithNewManifest:(NSDictionary *)rootManifest
                                    config:(EXUpdatesConfig *)config
                                  database:(EXUpdatesDatabase *)database
{
  NSDictionary *manifest = rootManifest;
  if (rootManifest[@"data"] && rootManifest[@"data"][@"publicManifest"]) {
    manifest = rootManifest[@"data"][@"publicManifest"];
  }
  if (manifest[@"manifest"]) {
    manifest = manifest[@"manifest"];
  }

  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"createdAt"];
  id runtimeVersion = manifest[@"nativeRuntimeVersion"];
  id launchAsset = manifest[@"launchAsset"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSNumber class]], @"commitTime should be a number");
  NSAssert([runtimeVersion isKindOfClass:[NSString class]], @"runtimeVersion should be a string");
  NSAssert([launchAsset isKindOfClass:[NSDictionary class]], @"launchAsset should be a dictionary");
  NSAssert(assets && [assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");
  
  id bundleUrlString = (NSDictionary *)launchAsset[@"url"];
  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"launchAsset.url should be a string");
  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"launchAsset.url should be a valid URL");

  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", commitTime];
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithKey:bundleKey type:EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];

  for (NSDictionary *assetDict in (NSArray *)assets) {
    NSAssert([assetDict isKindOfClass:[NSDictionary class]], @"assets must be objects");
    id key = assetDict[@"key"];
    id urlString = assetDict[@"url"];
    id type = assetDict[@"type"];
    id metadata = assetDict[@"metadata"];
    id mainBundleFilename = assetDict[@"mainBundleFilename"];
    NSAssert(key && [key isKindOfClass:[NSString class]], @"asset key should be a nonnull string");
    NSAssert(urlString && [urlString isKindOfClass:[NSString class]], @"asset url should be a nonnull string");
    NSAssert(type && [type isKindOfClass:[NSString class]], @"asset type should be a nonnull string");
    NSURL *url = [NSURL URLWithString:(NSString *)urlString];
    NSAssert(url, @"asset url should be a valid URL");

    EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
    asset.url = url;

    if (metadata) {
      NSAssert([metadata isKindOfClass:[NSDictionary class]], @"asset metadata should be an object");
      asset.metadata = (NSDictionary *)metadata;
    }

    if (mainBundleFilename) {
      NSAssert([mainBundleFilename isKindOfClass:[NSString class]], @"asset localPath should be a string");
      asset.mainBundleFilename = (NSString *)mainBundleFilename;
    }

    [processedAssets addObject:asset];
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = (NSString *)runtimeVersion;
  update.status = EXUpdatesUpdateStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;
  update.metadata = manifest;

  return update;
}

@end

NS_ASSUME_NONNULL_END
