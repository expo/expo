//
//  LOTCompositionContainer.m
//  Lottie
//
//  Created by brandon_withrow on 7/18/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTCompositionContainer.h"
#import "LOTAsset.h"
#import "CGGeometry+LOTAdditions.h"
#import "LOTHelpers.h"
#import "LOTValueInterpolator.h"
#import "LOTAnimatorNode.h"
#import "LOTRenderNode.h"
#import "LOTRenderGroup.h"
#import "LOTNumberInterpolator.h"

@implementation LOTCompositionContainer {
  NSNumber *_frameOffset;
  CALayer *DEBUG_Center;
  NSMutableDictionary *_keypathCache;
  LOTNumberInterpolator *_timeInterpolator;
}

- (instancetype)initWithModel:(LOTLayer *)layer
                 inLayerGroup:(LOTLayerGroup *)layerGroup
               withLayerGroup:(LOTLayerGroup *)childLayerGroup
              withAssestGroup:(LOTAssetGroup *)assetGroup {
  self = [super initWithModel:layer inLayerGroup:layerGroup];
  if (self) {
    DEBUG_Center = [CALayer layer];
    
    DEBUG_Center.bounds = CGRectMake(0, 0, 20, 20);
    DEBUG_Center.borderColor = [UIColor orangeColor].CGColor;
    DEBUG_Center.borderWidth = 2;
    DEBUG_Center.masksToBounds = YES;
    if (ENABLE_DEBUG_SHAPES) {
      [self.wrapperLayer addSublayer:DEBUG_Center];
    }
    if (layer.startFrame) {
      _frameOffset = layer.startFrame;
    } else {
      _frameOffset = @0;
    }

    if (layer.timeRemapping) {
      _timeInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:layer.timeRemapping.keyframes];
    }

    [self initializeWithChildGroup:childLayerGroup withAssetGroup:assetGroup];
  }
  return self;
}

- (void)initializeWithChildGroup:(LOTLayerGroup *)childGroup
                  withAssetGroup:(LOTAssetGroup *)assetGroup {
  NSMutableDictionary *childMap = [NSMutableDictionary dictionary];
  NSMutableArray *children = [NSMutableArray array];
  NSArray *reversedItems = [[childGroup.layers reverseObjectEnumerator] allObjects];
  
  CALayer *maskedLayer = nil;
  for (LOTLayer *layer in reversedItems) {
    LOTAsset *asset;
    if (layer.referenceID) {
      // Get relevant Asset
      asset = [assetGroup assetModelForID:layer.referenceID];
    }
    
    LOTLayerContainer *child = nil;
    if (asset.layerGroup) {
      // Layer is a precomp
      LOTCompositionContainer *compLayer = [[LOTCompositionContainer alloc] initWithModel:layer inLayerGroup:childGroup withLayerGroup:asset.layerGroup withAssestGroup:assetGroup];
      child = compLayer;
    } else {
      child = [[LOTLayerContainer alloc] initWithModel:layer inLayerGroup:childGroup];
    }
    if (maskedLayer) {
      maskedLayer.mask = child;
      maskedLayer = nil;
    } else {
      if (layer.matteType == LOTMatteTypeAdd) {
        maskedLayer = child;
      }
      [self.wrapperLayer addSublayer:child];
    }
    [children addObject:child];
    if (child.layerName) {
      [childMap setObject:child forKey:child.layerName];
    }
  }
  _childMap = childMap;
  _childLayers = children;
}

- (void)displayWithFrame:(NSNumber *)frame forceUpdate:(BOOL)forceUpdate {
  if (ENABLE_DEBUG_LOGGING) NSLog(@"-------------------- Composition Displaying Frame %@ --------------------", frame);
  [super displayWithFrame:frame forceUpdate:forceUpdate];
  NSNumber *newFrame = @((frame.floatValue  - _frameOffset.floatValue) / self.timeStretchFactor.floatValue);
  if (_timeInterpolator) {
    newFrame = @([_timeInterpolator floatValueForFrame:newFrame]);
  }
  for (LOTLayerContainer *child in _childLayers) {
    [child displayWithFrame:newFrame forceUpdate:forceUpdate];
  }
  if (ENABLE_DEBUG_LOGGING) NSLog(@"-------------------- ------------------------------- --------------------");
  if (ENABLE_DEBUG_LOGGING) NSLog(@"-------------------- ------------------------------- --------------------");
}

- (void)setViewportBounds:(CGRect)viewportBounds {
  [super setViewportBounds:viewportBounds];
  for (LOTLayerContainer *layer in _childLayers) {
    layer.viewportBounds = viewportBounds;
  }
}

- (void)searchNodesForKeypath:(LOTKeypath * _Nonnull)keypath {
  if (self.layerName != nil) {
    [super searchNodesForKeypath:keypath];
  }
  if (self.layerName == nil ||
      [keypath pushKey:self.layerName]) {
    for (LOTLayerContainer *child in _childLayers) {
      [child searchNodesForKeypath:keypath];
    }
    if (self.layerName != nil) {
      [keypath popKey];
    }
  }
}

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate
              forKeypath:(LOTKeypath * _Nonnull)keypath {
  if (self.layerName != nil) {
    [super setValueDelegate:delegate forKeypath:keypath];
  }
  if (self.layerName == nil ||
      [keypath pushKey:self.layerName]) {
    for (LOTLayerContainer *child in _childLayers) {
      [child setValueDelegate:delegate forKeypath:keypath];
    }
    if (self.layerName != nil) {
      [keypath popKey];
    }
  }
}

- (nullable NSArray *)keysForKeyPath:(nonnull LOTKeypath *)keypath {
  if (_keypathCache == nil) {
    _keypathCache = [NSMutableDictionary dictionary];
  }
  [self searchNodesForKeypath:keypath];
  [_keypathCache addEntriesFromDictionary:keypath.searchResults];
  return keypath.searchResults.allKeys;
}

- (CALayer *)_layerForKeypath:(nonnull LOTKeypath *)keypath {
  id node = _keypathCache[keypath.absoluteKeypath];
  if (node == nil) {
    [self keysForKeyPath:keypath];
    node = _keypathCache[keypath.absoluteKeypath];
  }
  if (node == nil) {
    NSLog(@"LOTComposition could not find layer for keypath:%@", keypath.absoluteKeypath);
    return nil;
  }
  if ([node isKindOfClass:[CALayer class]]) {
    return (CALayer *)node;
  }
  if (![node isKindOfClass:[LOTRenderNode class]]) {
    NSLog(@"LOTComposition: Keypath return non-layer node:%@ ", keypath.absoluteKeypath);
    return nil;
  }
  if ([node isKindOfClass:[LOTRenderGroup class]]) {
    return [(LOTRenderGroup *)node containerLayer];
  }
  LOTRenderNode *renderNode = (LOTRenderNode *)node;
  return renderNode.outputLayer;
}

- (CGPoint)convertPoint:(CGPoint)point
         toKeypathLayer:(nonnull LOTKeypath *)keypath
        withParentLayer:(CALayer *_Nonnull)parent{
  CALayer *layer = [self _layerForKeypath:keypath];
  if (!layer) {
    return CGPointZero;
  }
  return [parent convertPoint:point toLayer:layer];
}

- (CGRect)convertRect:(CGRect)rect
       toKeypathLayer:(nonnull LOTKeypath *)keypath
      withParentLayer:(CALayer *_Nonnull)parent{
  CALayer *layer = [self _layerForKeypath:keypath];
  if (!layer) {
    return CGRectZero;
  }
  return [parent convertRect:rect toLayer:layer];
}

- (CGPoint)convertPoint:(CGPoint)point
       fromKeypathLayer:(nonnull LOTKeypath *)keypath
        withParentLayer:(CALayer *_Nonnull)parent{
  CALayer *layer = [self _layerForKeypath:keypath];
  if (!layer) {
    return CGPointZero;
  }
  return [parent convertPoint:point fromLayer:layer];
}

- (CGRect)convertRect:(CGRect)rect
     fromKeypathLayer:(nonnull LOTKeypath *)keypath
      withParentLayer:(CALayer *_Nonnull)parent{
  CALayer *layer = [self _layerForKeypath:keypath];
  if (!layer) {
    return CGRectZero;
  }
  return [parent convertRect:rect fromLayer:layer];
}

- (void)addSublayer:(nonnull CALayer *)subLayer
     toKeypathLayer:(nonnull LOTKeypath *)keypath {
  CALayer *layer = [self _layerForKeypath:keypath];
  if (layer) {
    [layer addSublayer:subLayer];
  }
}

- (void)maskSublayer:(nonnull CALayer *)subLayer
      toKeypathLayer:(nonnull LOTKeypath *)keypath {
  CALayer *layer = [self _layerForKeypath:keypath];
  if (layer) {
    [layer.superlayer addSublayer:subLayer];
    [layer removeFromSuperlayer];
    subLayer.mask = layer;
  }
}

@end
