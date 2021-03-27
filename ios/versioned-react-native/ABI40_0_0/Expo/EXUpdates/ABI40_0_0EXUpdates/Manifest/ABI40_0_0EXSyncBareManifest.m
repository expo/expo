//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncBareManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncEmbeddedLoader.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest+Private.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI40_0_0EXSyncBareManifest

+ (ABI40_0_0EXSyncManifest *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(ABI40_0_0EXSyncConfig *)config
                                   database:(ABI40_0_0EXSyncDatabase *)database
{
  ABI40_0_0EXSyncManifest *update = [[ABI40_0_0EXSyncManifest alloc] initWithRawManifest:manifest
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

  NSMutableArray<ABI40_0_0EXSyncAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", commitTime];
  ABI40_0_0EXSyncAsset *jsBundleAsset = [[ABI40_0_0EXSyncAsset alloc] initWithKey:bundleKey type:ABI40_0_0EXSyncBareEmbeddedBundleFileType];
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI40_0_0EXSyncBareEmbeddedBundleFilename;
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
    ABI40_0_0EXSyncAsset *asset = [[ABI40_0_0EXSyncAsset alloc] initWithKey:key type:(NSString *)type];
    asset.mainBundleDir = mainBundleDir;
    asset.mainBundleFilename = mainBundleFilename;

    [processedAssets addObject:asset];
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = [ABI40_0_0EXSyncUtils getRuntimeVersionWithConfig:config];
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = ABI40_0_0EXSyncManifestStatusEmbedded;
  update.keep = YES;
  update.assets = processedAssets;

  if ([update.runtimeVersion containsString:@","]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Should not be initializing ABI40_0_0EXSyncBareManifest in an environment with multiple runtime versions."
                                 userInfo:@{}];
  }

  return update;
}

@end

NS_ASSUME_NONNULL_END

