//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesNewUpdate.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate+Private.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXUpdatesNewUpdate

+ (ABI40_0_0EXUpdatesUpdate *)updateWithNewManifest:(NSDictionary *)manifest
                                    config:(ABI40_0_0EXUpdatesConfig *)config
                                  database:(ABI40_0_0EXUpdatesDatabase *)database
{
  ABI40_0_0EXUpdatesUpdate *update = [[ABI40_0_0EXUpdatesUpdate alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"commitTime"];
  id runtimeVersion = manifest[@"runtimeVersion"];
  id metadata = manifest[@"metadata"];
  id bundleUrlString = manifest[@"bundleUrl"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSNumber class]], @"commitTime should be a number");
  NSAssert([runtimeVersion isKindOfClass:[NSString class]], @"runtimeVersion should be a string");
  NSAssert(!metadata || [metadata isKindOfClass:[NSDictionary class]], @"metadata should be null or an object");
  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"bundleUrl should be a string");
  NSAssert(assets && [assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");
  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"bundleUrl should be a valid URL");

  NSMutableArray<ABI40_0_0EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", commitTime];
  ABI40_0_0EXUpdatesAsset *jsBundleAsset = [[ABI40_0_0EXUpdatesAsset alloc] initWithKey:bundleKey type:ABI40_0_0EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI40_0_0EXUpdatesEmbeddedBundleFilename;
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

    ABI40_0_0EXUpdatesAsset *asset = [[ABI40_0_0EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
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
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = ABI40_0_0EXUpdatesUpdateStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

@end

NS_ASSUME_NONNULL_END
