//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesExpoAssetBaseUrl = @"https://d1wp6m56sqw74a.cloudfront.net/~assets/";
static NSString * const EXUpdatesExpoIoDomain = @"expo.io";
static NSString * const EXUpdatesExpHostDomain = @"exp.host";
static NSString * const EXUpdatesExpoTestDomain = @"expo.test";

@implementation EXUpdatesLegacyUpdate

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(NSDictionary *)manifest
                                       config:(EXUpdatesConfig *)config
                                     database:(EXUpdatesDatabase *)database
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  if ([[self class] areDevToolsEnabledWithManifest:manifest]) {
    // XDL does not set a releaseId or commitTime for development manifests.
    // we do not need these so we just stub them out
    update.updateId = [NSUUID UUID];
    update.commitTime = [NSDate date];
  } else {
    id updateId = manifest[@"releaseId"];
    NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
    update.updateId = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
    NSAssert(update.updateId, @"update ID should be a valid UUID");

    id commitTimeString = manifest[@"commitTime"];
    NSAssert([commitTimeString isKindOfClass:[NSString class]], @"commitTime should be a string");
    update.commitTime = [RCTConvert NSDate:commitTimeString];
  }

  if ([[self class] isDevelopmentModeManifest:manifest]) {
    update.isDevelopmentMode = YES;
    update.status = EXUpdatesUpdateStatusDevelopment;
  } else {
    update.status = EXUpdatesUpdateStatusPending;
  }

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

  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"bundleUrl should be a string");
  NSAssert([assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"bundleUrl should be a valid URL");

  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = [NSString stringWithFormat:@"bundle-%@", [EXUpdatesUtils sha256WithData:[(NSString *)bundleUrlString dataUsingEncoding:NSUTF8StringEncoding]]];
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithKey:bundleKey type:EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];
  
  NSURL *bundledAssetBaseUrl = [[self class] bundledAssetBaseUrlWithManifest:manifest config:config];

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

  update.metadata = manifest;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;

  return update;
}

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest config:(EXUpdatesConfig *)config
{
  NSURL *manifestUrl = config.updateUrl;
  NSString *host = manifestUrl.host;
  if (!host ||
      [host containsString:EXUpdatesExpoIoDomain] ||
      [host containsString:EXUpdatesExpHostDomain] ||
      [host containsString:EXUpdatesExpoTestDomain]) {
    return [NSURL URLWithString:EXUpdatesExpoAssetBaseUrl];
  } else {
    NSString *assetsPathOrUrl = manifest[@"assetUrlOverride"] ?: @"assets";
    // assetUrlOverride may be an absolute or relative URL
    // if relative, we should resolve with respect to the manifest URL
    NSURL *maybeAssetsUrl = [NSURL URLWithString:assetsPathOrUrl];
    if (maybeAssetsUrl && maybeAssetsUrl.scheme) {
      return maybeAssetsUrl;
    } else if (maybeAssetsUrl && maybeAssetsUrl.standardizedURL) {
      return [manifestUrl.URLByDeletingLastPathComponent URLByAppendingPathComponent:maybeAssetsUrl.standardizedURL.relativeString];
    } else {
      return [manifestUrl.URLByDeletingLastPathComponent URLByAppendingPathComponent:assetsPathOrUrl];
    }
  }
}

+ (BOOL)isDevelopmentModeManifest:(NSDictionary *)manifest
{
  NSDictionary *manifestPackagerOptsConfig = manifest[@"packagerOpts"];
  return (manifest[@"developer"] != nil && manifestPackagerOptsConfig != nil && [@(YES) isEqualToNumber:manifestPackagerOptsConfig[@"dev"]]);
}

+ (BOOL)areDevToolsEnabledWithManifest:(NSDictionary *)manifest
{
  NSDictionary *manifestDeveloperConfig = manifest[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
}

@end

NS_ASSUME_NONNULL_END
