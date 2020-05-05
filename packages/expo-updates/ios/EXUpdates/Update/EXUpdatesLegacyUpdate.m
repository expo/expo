//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const kEXUpdatesExpoAssetBaseUrl = @"https://d1wp6m56sqw74a.cloudfront.net/~assets/";
static NSString * const kEXUpdatesExpoIoDomain = @"expo.io";
static NSString * const kEXUpdatesExpHostDomain = @"exp.host";
static NSString * const kEXUpdatesExpoTestDomain = @"expo.test";

@implementation EXUpdatesLegacyUpdate

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(NSDictionary *)manifest
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest];

  id updateId = manifest[@"releaseId"];
  id commitTimeString = manifest[@"commitTime"];
  id bundleUrlString = manifest[@"bundleUrl"];
  id assets = manifest[@"bundledAssets"] ?: @[];

  id sdkVersion = manifest[@"sdkVersion"];
  id runtimeVersion = manifest[@"runtimeVersion"];
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSDictionary class]]) {
    id runtimeVersionIos = ((NSDictionary *)runtimeVersion)[@"ios"];
    NSAssert([runtimeVersionIos isKindOfClass:[NSString class]], @"runtimeVersion['ios'] should be a string");
    update.runtimeVersion = (NSString *)runtimeVersionIos;
  } else if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    update.runtimeVersion = (NSString *)runtimeVersion;
  } else {
    NSAssert([sdkVersion isKindOfClass:[NSString class]], @"sdkVersion should be a string");
    update.runtimeVersion = (NSString *)sdkVersion;
  }

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTimeString isKindOfClass:[NSString class]], @"commitTime should be a string");
  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"bundleUrl should be a string");
  NSAssert([assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");
  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"bundleUrl should be a valid URL");

  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSDate *commitTime = [RCTConvert NSDate:commitTimeString];
  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%f", commitTime.timeIntervalSince1970];
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithKey:bundleKey type:kEXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = kEXUpdatesEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];
  
  NSURL *bundledAssetBaseUrl = [[self class] bundledAssetBaseUrlWithManifest:manifest];

  for (NSString *bundledAsset in (NSArray *)assets) {
    NSAssert([bundledAsset isKindOfClass:[NSString class]], @"bundledAssets must be an array of strings");

    NSRange extensionStartRange = [bundledAsset rangeOfString:@"." options:NSBackwardsSearch];
    NSUInteger prefixLength = [@"asset_" length];
    NSString *filename;
    NSString *hash;
    NSString *type;
    if (extensionStartRange.location == NSNotFound) {
      filename = bundledAsset;
      hash = [bundledAsset substringFromIndex:prefixLength];
      type = @"";
    } else {
      filename = [bundledAsset substringToIndex:extensionStartRange.location];
      NSRange hashRange = NSMakeRange(prefixLength, extensionStartRange.location - prefixLength);
      hash = [bundledAsset substringWithRange:hashRange];
      type = [bundledAsset substringFromIndex:extensionStartRange.location + 1];
    }

    NSURL *url = [bundledAssetBaseUrl URLByAppendingPathComponent:hash];

    NSString *key = [NSString stringWithFormat:@"%@.%@", hash, type];
    EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
    asset.url = url;
    asset.mainBundleFilename = filename;

    [processedAssets addObject:asset];
  }

  update.updateId = uuid;
  update.commitTime = commitTime;
  update.metadata = manifest;
  update.status = EXUpdatesUpdateStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest
{
  NSURL *manifestUrl = [EXUpdatesConfig sharedInstance].updateUrl;
  NSString *host = manifestUrl.host;
  if (!host ||
      [host containsString:kEXUpdatesExpoIoDomain] ||
      [host containsString:kEXUpdatesExpHostDomain] ||
      [host containsString:kEXUpdatesExpoTestDomain]) {
    return [NSURL URLWithString:kEXUpdatesExpoAssetBaseUrl];
  } else {
    NSString *assetsPath = manifest[@"assetUrlOverride"] ?: @"assets";
    return [manifestUrl.URLByDeletingLastPathComponent URLByAppendingPathComponent:assetsPath];
  }
}

@end

NS_ASSUME_NONNULL_END
