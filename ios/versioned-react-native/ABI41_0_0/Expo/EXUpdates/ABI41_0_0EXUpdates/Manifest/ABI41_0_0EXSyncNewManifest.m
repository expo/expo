//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXStructuredHeaders/ABI41_0_0EXStructuredHeadersParser.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncEmbeddedLoader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncNewManifest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest+Private.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncUtils.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI41_0_0EXSyncNewManifest

+ (ABI41_0_0EXSyncManifest *)updateWithNewManifest:(NSDictionary *)rootManifest
                                  response:(nullable NSURLResponse *)response
                                    config:(ABI41_0_0EXSyncConfig *)config
                                  database:(ABI41_0_0EXSyncDatabase *)database
{
  NSDictionary *manifest = rootManifest;
  if (manifest[@"manifest"]) {
    manifest = manifest[@"manifest"];
  }

  ABI41_0_0EXSyncManifest *update = [[ABI41_0_0EXSyncManifest alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"createdAt"];
  id runtimeVersion = manifest[@"runtimeVersion"];
  id launchAsset = manifest[@"launchAsset"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSString class]], @"createdAt should be a string");
  NSAssert([runtimeVersion isKindOfClass:[NSString class]], @"runtimeVersion should be a string");
  NSAssert([launchAsset isKindOfClass:[NSDictionary class]], @"launchAsset should be a dictionary");
  NSAssert(!assets || [assets isKindOfClass:[NSArray class]], @"assets should be null or an array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");
  
  id bundleUrlString = (NSDictionary *)launchAsset[@"url"];
  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"launchAsset.url should be a string");
  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"launchAsset.url should be a valid URL");

  NSMutableArray<ABI41_0_0EXSyncAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = launchAsset[@"key"];
  ABI41_0_0EXSyncAsset *jsBundleAsset = [[ABI41_0_0EXSyncAsset alloc] initWithKey:bundleKey type:ABI41_0_0EXSyncEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = ABI41_0_0EXSyncEmbeddedBundleFilename;
  [processedAssets addObject:jsBundleAsset];

  if (assets) {
    for (NSDictionary *assetDict in (NSArray *)assets) {
      NSAssert([assetDict isKindOfClass:[NSDictionary class]], @"assets must be objects");
      id key = assetDict[@"key"];
      id urlString = assetDict[@"url"];
      id type = assetDict[@"contentType"];
      id metadata = assetDict[@"metadata"];
      id mainBundleFilename = assetDict[@"mainBundleFilename"];
      NSAssert(key && [key isKindOfClass:[NSString class]], @"asset key should be a nonnull string");
      NSAssert(urlString && [urlString isKindOfClass:[NSString class]], @"asset url should be a nonnull string");
      NSAssert(type && [type isKindOfClass:[NSString class]], @"asset contentType should be a nonnull string");
      NSURL *url = [NSURL URLWithString:(NSString *)urlString];
      NSAssert(url, @"asset url should be a valid URL");

      ABI41_0_0EXSyncAsset *asset = [[ABI41_0_0EXSyncAsset alloc] initWithKey:key type:(NSString *)type];
      asset.url = url;

      if (metadata) {
        NSAssert([metadata isKindOfClass:[NSDictionary class]], @"asset metadata should be an object");
        asset.metadata = (NSDictionary *)metadata;
      }

      if (mainBundleFilename) {
        NSAssert([mainBundleFilename isKindOfClass:[NSString class]], @"asset localPath should be a string");
        asset.mainBundleFilename = (NSString *)mainBundleFilename;
      }

      [processedAssets addObject:asset];
    }
  }

  update.updateId = uuid;
  update.commitTime = [ABI41_0_0RCTConvert NSDate:(NSString *)commitTime];
  update.runtimeVersion = (NSString *)runtimeVersion;
  update.status = ABI41_0_0EXSyncManifestStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;
  update.metadata = manifest;

  if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
    NSDictionary *headersDictionary = ((NSHTTPURLResponse *)response).allHeaderFields;
    update.serverDefinedHeaders = [[self class] dictionaryWithStructuredHeader:headersDictionary[@"expo-server-defined-headers"]];
    update.manifestFilters = [[self class] dictionaryWithStructuredHeader:headersDictionary[@"expo-manifest-filters"]];
  }

  return update;
}

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString
{
  if (!headerString) {
    return nil;
  }

  ABI41_0_0EXStructuredHeadersParser *parser = [[ABI41_0_0EXStructuredHeadersParser alloc] initWithRawInput:headerString fieldType:ABI41_0_0EXStructuredHeadersParserFieldTypeDictionary ignoringParameters:YES];
  NSError *error;
  NSDictionary *parserOutput = [parser parseStructuredFieldsWithError:&error];
  if (!parserOutput || error || ![parserOutput isKindOfClass:[NSDictionary class]]) {
    NSLog(@"Error parsing header value: %@", error ? error.localizedDescription : @"Header was not a structured fields dictionary");
    return nil;
  }

  NSMutableDictionary *mutableDict = [NSMutableDictionary dictionaryWithCapacity:parserOutput.count];
  [parserOutput enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    // ignore any dictionary entries whose type is not string, number, or boolean
    // since this will be re-serialized to JSON
    if ([obj isKindOfClass:[NSString class]] || [obj isKindOfClass:[NSNumber class]]) {
      mutableDict[key] = obj;
    }
  }];
  return mutableDict.copy;
}

@end

NS_ASSUME_NONNULL_END
