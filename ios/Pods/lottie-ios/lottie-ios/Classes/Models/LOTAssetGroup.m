//
//  LOTAssetGroup.m
//  Pods
//
//  Created by Brandon Withrow on 2/17/17.
//
//

#import "LOTAssetGroup.h"
#import "LOTAsset.h"

@implementation LOTAssetGroup {
  NSMutableDictionary<NSString *, LOTAsset *> *_assetMap;
  NSDictionary<NSString *, NSDictionary *> *_assetJSONMap;
}

- (instancetype _Nonnull)initWithJSON:(NSArray * _Nonnull)jsonArray
                      withAssetBundle:(NSBundle * _Nullable)bundle
                        withFramerate:(NSNumber * _Nonnull)framerate {
  self = [super init];
  if (self) {
    _assetBundle = bundle;
    _assetMap = [NSMutableDictionary dictionary];
    NSMutableDictionary *assetJSONMap = [NSMutableDictionary dictionary];
    for (NSDictionary<NSString *, NSString *> *assetDictionary in jsonArray) {
      NSString *referenceID = assetDictionary[@"id"];
      if (referenceID) {
        assetJSONMap[referenceID] = assetDictionary;
      }
    }
    _assetJSONMap = assetJSONMap;
  }
  return self;
}

- (void)buildAssetNamed:(NSString *)refID
          withFramerate:(NSNumber * _Nonnull)framerate {
  
  if ([self assetModelForID:refID]) {
    return;
  }
  
  NSDictionary *assetDictionary = _assetJSONMap[refID];
  if (assetDictionary) {
    LOTAsset *asset = [[LOTAsset alloc] initWithJSON:assetDictionary
                                      withAssetGroup:self
                                     withAssetBundle:_assetBundle
                                       withFramerate:framerate];
    _assetMap[refID] = asset;
  }
}

- (void)finalizeInitializationWithFramerate:(NSNumber * _Nonnull)framerate {
  for (NSString *refID in _assetJSONMap.allKeys) {
    [self buildAssetNamed:refID withFramerate:framerate];
  }
  _assetJSONMap = nil;
}

- (LOTAsset *)assetModelForID:(NSString *)assetID {
  return _assetMap[assetID];
}

- (void)setRootDirectory:(NSString *)rootDirectory {
    _rootDirectory = rootDirectory;
    [_assetMap enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, LOTAsset * _Nonnull obj, BOOL * _Nonnull stop) {
        obj.rootDirectory = rootDirectory;
    }];
}
@end
