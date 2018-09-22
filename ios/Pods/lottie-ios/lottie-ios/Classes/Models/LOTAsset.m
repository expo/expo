//
//  LOTAsset.m
//  Pods
//
//  Created by Brandon Withrow on 2/16/17.
//
//

#import "LOTAsset.h"
#import "LOTLayer.h"
#import "LOTLayerGroup.h"
#import "LOTAssetGroup.h"

@implementation LOTAsset

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary
              withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
             withAssetBundle:(NSBundle *_Nonnull)bundle
               withFramerate:(NSNumber *)framerate {
  self = [super init];
  if (self) {
    _assetBundle = bundle;
    [self _mapFromJSON:jsonDictionary
        withAssetGroup:assetGroup
     withFramerate:framerate];
  }
  return self;
}

- (void)_mapFromJSON:(NSDictionary *)jsonDictionary
      withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
       withFramerate:(NSNumber *)framerate {
  _referenceID = [jsonDictionary[@"id"] copy];
  
  if (jsonDictionary[@"w"]) {
    _assetWidth = [jsonDictionary[@"w"] copy];
  }
  
  if (jsonDictionary[@"h"]) {
    _assetHeight = [jsonDictionary[@"h"] copy];
  }
  
  if (jsonDictionary[@"u"]) {
    _imageDirectory = [jsonDictionary[@"u"] copy];
  }
  
  if (jsonDictionary[@"p"]) {
    _imageName = [jsonDictionary[@"p"] copy];
  }

  NSArray *layersJSON = jsonDictionary[@"layers"];
  if (layersJSON) {
    _layerGroup = [[LOTLayerGroup alloc] initWithLayerJSON:layersJSON
                                            withAssetGroup:assetGroup
                                             withFramerate:framerate];
  }
}

@end
