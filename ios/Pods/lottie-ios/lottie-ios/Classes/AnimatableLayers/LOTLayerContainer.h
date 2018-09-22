//
//  LOTLayerContainer.h
//  Lottie
//
//  Created by brandon_withrow on 7/18/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTPlatformCompat.h"
#import "LOTLayer.h"
#import "LOTLayerGroup.h"
#import "LOTKeypath.h"
#import "LOTValueDelegate.h"

@class LOTValueCallback;

@interface LOTLayerContainer : CALayer

- (instancetype _Nonnull)initWithModel:(LOTLayer * _Nullable)layer
                 inLayerGroup:(LOTLayerGroup * _Nullable)layerGroup;

@property (nonatomic,  readonly, strong, nullable) NSString *layerName;
@property (nonatomic, nullable) NSNumber *currentFrame;
@property (nonatomic, readonly, nonnull) NSNumber *timeStretchFactor;
@property (nonatomic, assign) CGRect viewportBounds;
@property (nonatomic, readonly, nonnull) CALayer *wrapperLayer;
@property (nonatomic, readonly, nonnull) NSDictionary *valueInterpolators;

- (void)displayWithFrame:(NSNumber * _Nonnull)frame;
- (void)displayWithFrame:(NSNumber * _Nonnull)frame forceUpdate:(BOOL)forceUpdate;

- (void)searchNodesForKeypath:(LOTKeypath * _Nonnull)keypath;

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate
              forKeypath:(LOTKeypath * _Nonnull)keypath;

@end
