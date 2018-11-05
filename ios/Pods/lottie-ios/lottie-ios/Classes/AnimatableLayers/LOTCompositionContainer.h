//
//  LOTCompositionContainer.h
//  Lottie
//
//  Created by brandon_withrow on 7/18/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTLayerContainer.h"
#import "LOTAssetGroup.h"

@interface LOTCompositionContainer : LOTLayerContainer

- (instancetype _Nonnull)initWithModel:(LOTLayer * _Nullable)layer
                          inLayerGroup:(LOTLayerGroup * _Nullable)layerGroup
                        withLayerGroup:(LOTLayerGroup * _Nullable)childLayerGroup
                       withAssestGroup:(LOTAssetGroup * _Nullable)assetGroup;

- (nullable NSArray *)keysForKeyPath:(nonnull LOTKeypath *)keypath;

- (CGPoint)convertPoint:(CGPoint)point
         toKeypathLayer:(nonnull LOTKeypath *)keypath
        withParentLayer:(CALayer *_Nonnull)parent;

- (CGRect)convertRect:(CGRect)rect
       toKeypathLayer:(nonnull LOTKeypath *)keypath
      withParentLayer:(CALayer *_Nonnull)parent;

- (CGPoint)convertPoint:(CGPoint)point
       fromKeypathLayer:(nonnull LOTKeypath *)keypath
        withParentLayer:(CALayer *_Nonnull)parent;

- (CGRect)convertRect:(CGRect)rect
     fromKeypathLayer:(nonnull LOTKeypath *)keypath
      withParentLayer:(CALayer *_Nonnull)parent;

- (void)addSublayer:(nonnull CALayer *)subLayer
    toKeypathLayer:(nonnull LOTKeypath *)keypath;

- (void)maskSublayer:(nonnull CALayer *)subLayer
     toKeypathLayer:(nonnull LOTKeypath *)keypath;

@property (nonatomic, readonly, nonnull) NSArray<LOTLayerContainer *> *childLayers;
@property (nonatomic, readonly, nonnull)  NSDictionary *childMap;

@end
