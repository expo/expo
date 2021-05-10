//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesLegacyUpdate.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate+Private.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUtils.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI39_0_0EXUpdatesExpoAssetBaseUrl = @"https://d1wp6m56sqw74a.cloudfront.net/~assets/";
static NSString * const ABI39_0_0EXUpdatesExpoIoDomain = @"expo.io";
static NSString * const ABI39_0_0EXUpdatesExpHostDomain = @"exp.host";
static NSString * const ABI39_0_0EXUpdatesExpoTestDomain = @"expo.test";

@implementation ABI39_0_0EXUpdatesLegacyUpdate

+ (ABI39_0_0EXUpdatesUpdate *)updateWithLegacyManifest:(ABI39_0_0EXUpdatesLegacyRawManifest *)manifest
                                       config:(ABI39_0_0EXUpdatesConfig *)config
                                     database:(ABI39_0_0EXUpdatesDatabase *)database
{
  ABI39_0_0EXUpdatesUpdate *update = [[ABI39_0_0EXUpdatesUpdate alloc] initWithRawManifest:manifest
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
    NSAssert(update.updateId, @"update ID should be a valid UUID");

    NSString *commitTimeString = manifest.commitTime;
    update.commitTime = [ABI39_0_0RCTConvert NSDate:commitTimeString];
  }

  if (manifest.isDevelopmentMode) {
    update.isDevelopmentMode = YES;
    update.status = ABI39_0_0EXUpdatesUpdateStatusDevelopment;
  } else {
    update.status = ABI39_0_0EXUpdatesUpdateStatusPending;
  }

  NSString *bundleUrlString = manifest.bundleUrl;
  NSArray *assets = manifest.bundledAssets ?: @[];

  id runtimeVersion = manifest.runtimeVersion;
  if (runtimeVersion && [runtimeVersion isKindOfClass:[NSDictionary class]]) {
    id runtimeVersionIos = ((NSDictionary *)runtimeVersion)[@"ios"];
    NSAssert([runtimeVersionIos isKindOfClass:[NSString class]], @"runtimeVersion['ios'] should be a string");
    update.runtimeVersion = (NSString *)runtimeVersionIos;
  } else if (runtimeVersion && [runtimeVersion isKindOfClass:[NSString class]]) {
    update.runtimeVersion = (NSString *)runtimeVersion;
  } else {
    NSString *sdkVersion = manifest.sdkVersion;
    NSAssert(sdkVersion != nil, @"sdkVersion should not be null");
    update.runtimeVersion = sdkVersion;
  }

  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"bundleUrl should be a valid URL");

  NSMutableArray<ABI39_0_0EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = manifest.bundleKey ?: nil;
  ABI39_0_0EXUpdatesAsset *jsBundleAsset = [[ABI39_0_0EXUpdatesAsset alloc] initWithKey:bundleKey type:ABI39_0_0EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI39_0_0EXUpdatesEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];
  
  NSURL *bundledAssetBaseUrl = [[self class] bundledAssetBaseUrlWithManifest:manifest config:config];

  for (NSString *bundledAsset in assets) {
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

    NSString *key = hash;
    ABI39_0_0EXUpdatesAsset *asset = [[ABI39_0_0EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
    asset.url = url;
    asset.mainBundleFilename = filename;

    [processedAssets addObject:asset];
  }

  update.manifest = manifest.rawManifestJSON;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

+ (NSURL *)bundledAssetBaseUrlWithManifest:(ABI39_0_0EXUpdatesLegacyRawManifest *)manifest config:(ABI39_0_0EXUpdatesConfig *)config
{
  NSURL *manifestUrl = config.updateUrl;
  NSString *host = manifestUrl.host;
  if (!host ||
      [host containsString:ABI39_0_0EXUpdatesExpoIoDomain] ||
      [host containsString:ABI39_0_0EXUpdatesExpHostDomain] ||
      [host containsString:ABI39_0_0EXUpdatesExpoTestDomain]) {
    return [NSURL URLWithString:ABI39_0_0EXUpdatesExpoAssetBaseUrl];
  } else {
    NSString *assetsPathOrUrl = manifest.assetUrlOverride ?: @"assets";
    // assetUrlOverride may be an absolute or relative URL
    // if relative, we should resolve with respect to the manifest URL
    return [NSURL URLWithString:assetsPathOrUrl relativeToURL:manifestUrl].absoluteURL.standardizedURL;
  }
}

@end

NS_ASSUME_NONNULL_END
