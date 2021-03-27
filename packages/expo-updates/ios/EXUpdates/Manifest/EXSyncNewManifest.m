//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXStructuredHeaders/EXStructuredHeadersParser.h>
#import <EXUpdates/EXSyncEmbeddedLoader.h>
#import <EXUpdates/EXSyncNewManifest.h>
#import <EXUpdates/EXSyncManifest+Private.h>
#import <EXUpdates/EXSyncUtils.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXSyncNewManifest

+ (EXSyncManifest *)updateWithNewManifest:(NSDictionary *)rootManifest
                                  response:(nullable NSURLResponse *)response
                                    config:(EXSyncConfig *)config
                                  database:(EXSyncDatabase *)database
{
  NSDictionary *manifest = rootManifest;
  if (manifest[@"manifest"]) {
    manifest = manifest[@"manifest"];
  }

  EXSyncManifest *update = [[EXSyncManifest alloc] initWithRawManifest:manifest
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

  NSMutableArray<EXSyncAsset *> *processedAssets = [NSMutableArray new];

  NSString *bundleKey = launchAsset[@"key"];
  EXSyncAsset *jsBundleAsset = [[EXSyncAsset alloc] initWithKey:bundleKey type:EXSyncEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXSyncEmbeddedBundleFilename;
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

      EXSyncAsset *asset = [[EXSyncAsset alloc] initWithKey:key type:(NSString *)type];
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
  update.commitTime = [RCTConvert NSDate:(NSString *)commitTime];
  update.runtimeVersion = (NSString *)runtimeVersion;
  update.status = EXSyncManifestStatusPending;
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

  EXStructuredHeadersParser *parser = [[EXStructuredHeadersParser alloc] initWithRawInput:headerString fieldType:EXStructuredHeadersParserFieldTypeDictionary ignoringParameters:YES];
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
