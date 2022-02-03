//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesExpoAssetBaseUrl = @"https://classic-assets.eascdn.net/~assets/";
static NSString * const EXUpdatesExpoIoDomain = @"expo.io";
static NSString * const EXUpdatesExpHostDomain = @"exp.host";
static NSString * const EXUpdatesExpoTestDomain = @"expo.test";

@implementation EXUpdatesLegacyUpdate

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(EXManifestsLegacyManifest *)manifest
                                       config:(EXUpdatesConfig *)config
                                     database:(EXUpdatesDatabase *)database
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithManifest:manifest
                                                                  config:config
                                                                database:database];

  if (manifest.isUsingDeveloperTool) {
    // XDL does not set a releaseId or commitTime for development manifests.
    // we do not need these so we just stub them out
    update.updateId = [NSUUID UUID];
    update.commitTime = [NSDate date];
  } else {
    NSString *updateId = manifest.releaseID;
    update.updateId = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
    NSAssert(update.updateId, @"updateId should be a valid UUID");

    NSString *commitTimeString = manifest.commitTime;
    update.commitTime = [RCTConvert NSDate:commitTimeString];
  }

  if (manifest.isDevelopmentMode) {
    update.isDevelopmentMode = YES;
    update.status = EXUpdatesUpdateStatusDevelopment;
  } else {
    update.status = EXUpdatesUpdateStatusPending;
  }

  NSString *bundleUrlString = manifest.bundleUrl;
  NSArray *assets = manifest.bundledAssets ?: @[];

  if (manifest.runtimeVersion != nil) {
    update.runtimeVersion = manifest.runtimeVersion;
  } else {
    NSAssert(manifest.sdkVersion != nil, @"Manifest JSON must have a valid sdkVersion property defined");
    update.runtimeVersion = manifest.sdkVersion;
  }

  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"Manifest JSON must have a valid URL as the bundleUrl property");

  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = manifest.bundleKey ?: nil;
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithKey:bundleKey type:EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];

  NSURL *bundledAssetBaseUrl = [[self class] bundledAssetBaseUrlWithManifest:manifest config:config];

  for (NSString *bundledAsset in assets) {
    NSAssert([bundledAsset isKindOfClass:[NSString class]], @"Manifest JSON bundledAssets property must be an array of strings, found unexpected value: %@", bundledAsset);

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

    NSString *key = hash;
    EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
    asset.url = url;
    asset.mainBundleFilename = filename;

    [processedAssets addObject:asset];
  }

  update.manifestJSON = manifest.rawManifestJSON;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

+ (NSURL *)bundledAssetBaseUrlWithManifest:(EXManifestsLegacyManifest *)manifest config:(EXUpdatesConfig *)config
{
  NSURL *manifestUrl = config.updateUrl;
  NSString *host = manifestUrl.host;
  if (!host ||
      [host containsString:EXUpdatesExpoIoDomain] ||
      [host containsString:EXUpdatesExpHostDomain] ||
      [host containsString:EXUpdatesExpoTestDomain]) {
    return [NSURL URLWithString:EXUpdatesExpoAssetBaseUrl];
  } else {
    NSString *assetsPathOrUrl = manifest.assetUrlOverride ?: @"assets";
    // assetUrlOverride may be an absolute or relative URL
    // if relative, we should resolve with respect to the manifest URL
    return [NSURL URLWithString:assetsPathOrUrl relativeToURL:manifestUrl].absoluteURL.standardizedURL;
  }
}

@end

NS_ASSUME_NONNULL_END
