//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXStructuredHeaders/EXStructuredHeadersParser.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesUtils.h>
#import <React/RCTConvert.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesNewUpdate

+ (EXUpdatesUpdate *)updateWithNewManifest:(EXUpdatesNewRawManifest *)manifest
                                  response:(nullable NSURLResponse *)response
                                    config:(EXUpdatesConfig *)config
                                  database:(EXUpdatesDatabase *)database
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest
                                                                  config:config
                                                                database:database];
  
  NSString *updateId = manifest.rawID;
  NSString *commitTime = manifest.createdAt;
  NSString *runtimeVersion = manifest.runtimeVersion;
  NSDictionary *launchAsset = manifest.launchAsset;
  NSArray *assets = manifest.assets;
  
  NSAssert(updateId != nil, @"update ID should not be null");
  
  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");
  
  id bundleUrlString = (NSDictionary *)launchAsset[@"url"];
  NSAssert([bundleUrlString isKindOfClass:[NSString class]], @"launchAsset.url should be a string");
  NSURL *bundleUrl = [NSURL URLWithString:bundleUrlString];
  NSAssert(bundleUrl, @"launchAsset.url should be a valid URL");
  
  NSMutableArray<EXUpdatesAsset *> *processedAssets = [NSMutableArray new];
  
  NSString *bundleKey = launchAsset[@"key"];
  EXUpdatesAsset *jsBundleAsset = [[EXUpdatesAsset alloc] initWithKey:bundleKey type:EXUpdatesEmbeddedBundleFileType];
  jsBundleAsset.url = bundleUrl;
  jsBundleAsset.isLaunchAsset = YES;
  jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename;
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
      
      EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:(NSString *)type];
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
  update.status = EXUpdatesUpdateStatusPending;
  update.keep = YES;
  update.bundleUrl = bundleUrl;
  update.assets = processedAssets;
  update.manifest = manifest.rawManifestJSON;
  
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
