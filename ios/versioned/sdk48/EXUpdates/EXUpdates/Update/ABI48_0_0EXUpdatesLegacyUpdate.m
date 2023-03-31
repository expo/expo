//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesLegacyUpdate.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate+Private.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI48_0_0EXUpdatesExpoAssetBaseUrl = @"https://classic-assets.eascdn.net/~assets/";
static NSString * const ABI48_0_0EXUpdatesExpoIoDomain = @"expo.io";
static NSString * const ABI48_0_0EXUpdatesExpHostDomain = @"exp.host";
static NSString * const ABI48_0_0EXUpdatesExpoTestDomain = @"expo.test";

@implementation ABI48_0_0EXUpdatesLegacyUpdate

/**
 * Method for initializing updates with manifests in the classic format (i.e. come from Expo's
 * classic updates service or a self-hosted service following the classic updates format, such as
 * one making use of `expo-cli export`).
 *
 * Asset URLs are relative in this format, and we assume that if no base URL is explicitly provided,
 * the base URL is Expo's classic asset CDN.
 */
+ (ABI48_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI48_0_0EXManifestsLegacyManifest *)manifest
                                       config:(ABI48_0_0EXUpdatesConfig *)config
                                     database:(ABI48_0_0EXUpdatesDatabase *)database
{
  ABI48_0_0EXUpdatesUpdate *update = [[ABI48_0_0EXUpdatesUpdate alloc] initWithManifest:manifest
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
    update.commitTime = [ABI48_0_0RCTConvert NSDate:commitTimeString];
  }

  if (manifest.isDevelopmentMode) {
    update.isDevelopmentMode = YES;
    update.status = ABI48_0_0EXUpdatesUpdateStatusDevelopment;
  } else {
    update.status = ABI48_0_0EXUpdatesUpdateStatusPending;
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

  NSMutableArray<ABI48_0_0EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = manifest.bundleKey ?: nil;
  ABI48_0_0EXUpdatesAsset *jsBundleAsset = [[ABI48_0_0EXUpdatesAsset alloc] initWithKey:bundleKey type:ABI48_0_0EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI48_0_0EXUpdatesEmbeddedBundleFilename;
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
    ABI48_0_0EXUpdatesAsset *asset = [[ABI48_0_0EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
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

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI48_0_0EXManifestsLegacyManifest *)manifest config:(ABI48_0_0EXUpdatesConfig *)config
{
  NSURL *manifestUrl = config.updateUrl;
  NSString *host = manifestUrl.host;
  if (!host ||
      [host containsString:ABI48_0_0EXUpdatesExpoIoDomain] ||
      [host containsString:ABI48_0_0EXUpdatesExpHostDomain] ||
      [host containsString:ABI48_0_0EXUpdatesExpoTestDomain]) {
    return [NSURL URLWithString:ABI48_0_0EXUpdatesExpoAssetBaseUrl];
  } else {
    NSString *assetsPathOrUrl = manifest.assetUrlOverride ?: @"assets";
    // assetUrlOverride may be an absolute or relative URL
    // if relative, we should resolve with respect to the manifest URL
    return [NSURL URLWithString:assetsPathOrUrl relativeToURL:manifestUrl].absoluteURL.standardizedURL;
  }
}

@end

NS_ASSUME_NONNULL_END
