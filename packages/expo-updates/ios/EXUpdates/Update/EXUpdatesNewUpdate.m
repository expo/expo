//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesNewUpdate

+ (EXUpdatesUpdate *)updateWithNewManifest:(NSDictionary *)manifest
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest];

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

  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithUrl:bundleUrl type:kEXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = kEXUpdatesEmbeddedBundleFilename;
  jsBundleAsset.filename = [NSString stringWithFormat:@"%@.%@",
                              [EXUpdatesUtils sha256WithData:[[bundleUrl absoluteString] dataUsingEncoding:NSUTF8StringEncoding]],
                              kEXUpdatesEmbeddedBundleFileType];
  [processedAssets addObject:jsBundleAsset];

  for (NSDictionary *assetDict in (NSArray *)assets) {
    NSAssert([assetDict isKindOfClass:[NSDictionary class]], @"assets must be objects");
    id urlString = assetDict[@"url"];
    id type = assetDict[@"type"];
    id metadata = assetDict[@"metadata"];
    id mainBundleFilename = assetDict[@"mainBundleFilename"];
    NSAssert(urlString && [urlString isKindOfClass:[NSString class]], @"asset url should be a nonnull string");
    NSAssert(type && [type isKindOfClass:[NSString class]], @"asset type should be a nonnull string");
    NSURL *url = [NSURL URLWithString:(NSString *)urlString];
    NSAssert(url, @"asset url should be a valid URL");

    EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithUrl:url type:(NSString *)type];

    if (metadata) {
      NSAssert([metadata isKindOfClass:[NSDictionary class]], @"asset metadata should be an object");
      asset.metadata = (NSDictionary *)metadata;
    }

    if (mainBundleFilename) {
      NSAssert([mainBundleFilename isKindOfClass:[NSString class]], @"asset localPath should be a string");
      asset.mainBundleFilename = (NSString *)mainBundleFilename;
    }

    asset.filename = [NSString stringWithFormat:@"%@.%@",
                        [EXUpdatesUtils sha256WithData:[(NSString *)urlString dataUsingEncoding:NSUTF8StringEncoding]],
                        type];

    [processedAssets addObject:asset];
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = (NSString *)runtimeVersion;
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = EXUpdatesUpdateStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

@end

NS_ASSUME_NONNULL_END
