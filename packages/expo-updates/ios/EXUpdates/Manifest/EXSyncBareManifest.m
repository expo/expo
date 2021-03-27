//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncBareManifest.h>
#import <EXUpdates/EXSyncEmbeddedLoader.h>
#import <EXUpdates/EXSyncManifest+Private.h>
#import <EXUpdates/EXSyncUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXSyncBareManifest

+ (EXSyncManifest *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(EXSyncConfig *)config
                                   database:(EXSyncDatabase *)database
{
  EXSyncManifest *update = [[EXSyncManifest alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"commitTime"];
  id metadata = manifest[@"metadata"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSNumber class]], @"commitTime should be a number");
  NSAssert(!metadata || [metadata isKindOfClass:[NSDictionary class]], @"metadata should be null or an object");
  NSAssert(!assets || [assets isKindOfClass:[NSArray class]], @"assets should be null or an array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");

  NSMutableArray<EXSyncAsset *> *processedAssets = [NSMutableArray new];

  // use unsanitized id value from manifest
  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", updateId];
  EXSyncAsset *jsBundleAsset = [[EXSyncAsset alloc] initWithKey:bundleKey type:EXSyncBareEmbeddedBundleFileType];
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXSyncBareEmbeddedBundleFilename;
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

      NSString *key = [NSString stringWithFormat:@"%@.%@", packagerHash, type];
      EXSyncAsset *asset = [[EXSyncAsset alloc] initWithKey:key type:(NSString *)type];
      asset.mainBundleDir = mainBundleDir;
      asset.mainBundleFilename = mainBundleFilename;

      [processedAssets addObject:asset];
    }
  }

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = [EXSyncUtils getRuntimeVersionWithConfig:config];
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = EXSyncManifestStatusEmbedded;
  update.keep = YES;
  update.assets = processedAssets;

  if ([update.runtimeVersion containsString:@","]) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"Should not be initializing EXSyncBareManifest in an environment with multiple runtime versions."
                                 userInfo:@{}];
  }

  return update;
}

@end

NS_ASSUME_NONNULL_END

