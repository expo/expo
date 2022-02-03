//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesBareUpdate.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate+Private.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUtils.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI42_0_0EXUpdatesBareUpdate

+ (ABI42_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI42_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI42_0_0EXUpdatesConfig *)config
                                      database:(ABI42_0_0EXUpdatesDatabase *)database
{
  ABI42_0_0EXUpdatesUpdate *update = [[ABI42_0_0EXUpdatesUpdate alloc] initWithManifest:manifest
                                                                  config:config
                                                                database:database];

  NSString *updateId = manifest.rawId;
  NSNumber *commitTime = manifest.commitTimeNumber;
  NSArray *assets = manifest.assets;

  NSAssert(updateId != nil, @"update ID should not be null");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");

  NSMutableArray<ABI42_0_0EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  // use unsanitized id value from manifest
  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", updateId];
  ABI42_0_0EXUpdatesAsset *jsBundleAsset = [[ABI42_0_0EXUpdatesAsset alloc] initWithKey:bundleKey type:ABI42_0_0EXUpdatesBareEmbeddedBundleFileType];
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI42_0_0EXUpdatesBareEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];

  if (assets) {
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

      NSString *key = packagerHash;
      ABI42_0_0EXUpdatesAsset *asset = [[ABI42_0_0EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
      asset.mainBundleDir = mainBundleDir;
      asset.mainBundleFilename = mainBundleFilename;

      [processedAssets addObject:asset];
    }
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = [ABI42_0_0EXUpdatesUtils getRuntimeVersionWithConfig:config];
  update.status = ABI42_0_0EXUpdatesUpdateStatusEmbedded;
  update.keep = YES;
  update.assets = processedAssets;

  if ([update.runtimeVersion containsString:@","]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Should not be initializing ABI42_0_0EXUpdatesBareUpdate in an environment with multiple runtime versions."
                                 userInfo:@{}];
  }

  return update;
}

@end

NS_ASSUME_NONNULL_END

