//
//  LOTLayerGroup.m
//  Pods
//
//  Created by Brandon Withrow on 2/16/17.
//
//

#import "LOTLayerGroup.h"
#import "LOTLayer.h"
#import "LOTAssetGroup.h"

@implementation LOTLayerGroup {
  NSDictionary *_modelMap;
  NSDictionary *_referenceIDMap;
}

- (instancetype)initWithLayerJSON:(NSArray *)layersJSON
                   withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
                    withFramerate:(NSNumber *)framerate {
  self = [super init];
  if (self) {
    [self _mapFromJSON:layersJSON withAssetGroup:assetGroup withFramerate:framerate];
  }
  return self;
}

- (void)_mapFromJSON:(NSArray *)layersJSON
      withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
       withFramerate:(NSNumber *)framerate {
  
  NSMutableArray *layers = [NSMutableArray array];
  NSMutableDictionary *modelMap = [NSMutableDictionary dictionary];
  NSMutableDictionary *referenceMap = [NSMutableDictionary dictionary];
  
  for (NSDictionary *layerJSON in layersJSON) {
    LOTLayer *layer = [[LOTLayer alloc] initWithJSON:layerJSON
                                      withAssetGroup:assetGroup
                                       withFramerate:framerate];
    [layers addObject:layer];
    modelMap[layer.layerID] = layer;
    if (layer.referenceID) {
      referenceMap[layer.referenceID] = layer;
    }
  }
  
  _referenceIDMap = referenceMap;
  _modelMap = modelMap;
  _layers = layers;
}

- (LOTLayer *)layerModelForID:(NSNumber *)layerID {
  return _modelMap[layerID];
}

- (LOTLayer *)layerForReferenceID:(NSString *)referenceID {
  return _referenceIDMap[referenceID];
}

@end
