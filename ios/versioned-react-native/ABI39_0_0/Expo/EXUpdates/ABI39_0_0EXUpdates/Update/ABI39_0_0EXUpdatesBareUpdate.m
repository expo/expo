//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesBareUpdate.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate+Private.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI39_0_0EXUpdatesBareUpdate

+ (ABI39_0_0EXUpdatesUpdate *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(ABI39_0_0EXUpdatesConfig *)config
                                   database:(ABI39_0_0EXUpdatesDatabase *)database
{
  ABI39_0_0EXUpdatesUpdate *update = [[ABI39_0_0EXUpdatesUpdate alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"commitTime"];
  id metadata = manifest[@"metadata"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSNumber class]], @"commitTime should be a number");
  NSAssert(!metadata || [metadata isKindOfClass:[NSDictionary class]], @"metadata should be null or an object");
  NSAssert(assets && [assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");

  NSMutableArray<ABI39_0_0EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", commitTime];
  ABI39_0_0EXUpdatesAsset *jsBundleAsset = [[ABI39_0_0EXUpdatesAsset alloc] initWithKey:bundleKey type:ABI39_0_0EXUpdatesBareEmbeddedBundleFileType];
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI39_0_0EXUpdatesBareEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];

  for (NSDictionary *assetDict in (NSArray *)assets) {
    NSAssert([assetDict isKindOfClass:[NSDictionary class]], @"assets must be objects");
    id packagerHash = assetDict[@"packagerHash"];
    id type = assetDict[@"type"];
    id mainBundleDir = assetDict[@"nsBundleDir"];
    id mainBundleFilename = assetDict[@"nsBundleFilename"];
    NSAssert(packagerHash && [packagerHash isKindOfClass:[NSString class]], @"asset key should be a nonnull string");
    NSAssert(type && [type isKindOfClass:[NSString class]], @"asset type should be a nonnull string");
    NSAssert(mainBundleFilename && [mainBundleFilename isKindOfClass:[NSString class]], @"asset nsBundleFilename should be a nonnull string");
    if (mainBundleDir) {
      NSAssert([mainBundleDir isKindOfClass:[NSString class]], @"asset nsBundleDir should be a string");
    }

    NSString *key = [NSString stringWithFormat:@"%@.%@", packagerHash, type];
    ABI39_0_0EXUpdatesAsset *asset = [[ABI39_0_0EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
    asset.mainBundleDir = mainBundleDir;
    asset.mainBundleFilename = mainBundleFilename;

    [processedAssets addObject:asset];
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = [ABI39_0_0EXUpdatesUtils getRuntimeVersionWithConfig:config];
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = ABI39_0_0EXUpdatesUpdateStatusEmbedded;
  update.keep = YES;
  update.assets = processedAssets;

  if ([update.runtimeVersion containsString:@","]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Should not be initializing ABI39_0_0EXUpdatesBareUpdate in an environment with multiple runtime versions."
                                 userInfo:@{}];
  }

  return update;
}

@end

NS_ASSUME_NONNULL_END

