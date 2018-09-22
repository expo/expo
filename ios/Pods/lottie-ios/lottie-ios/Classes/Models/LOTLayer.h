//
//  LOTLayer.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "LOTPlatformCompat.h"
#import "LOTKeyframe.h"

@class LOTShapeGroup;
@class LOTMask;
@class LOTAsset;
@class LOTAssetGroup;

typedef enum : NSInteger {
  LOTLayerTypePrecomp,
  LOTLayerTypeSolid,
  LOTLayerTypeImage,
  LOTLayerTypeNull,
  LOTLayerTypeShape,
  LOTLayerTypeUnknown
} LOTLayerType;

typedef enum : NSInteger {
  LOTMatteTypeNone,
  LOTMatteTypeAdd,
  LOTMatteTypeInvert,
  LOTMatteTypeUnknown
} LOTMatteType;

NS_ASSUME_NONNULL_BEGIN

@interface LOTLayer : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary
              withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
               withFramerate:(NSNumber *)framerate;

@property (nonatomic, readonly) NSString *layerName;
@property (nonatomic, readonly, nullable) NSString *referenceID;
@property (nonatomic, readonly) NSNumber *layerID;
@property (nonatomic, readonly) LOTLayerType layerType;
@property (nonatomic, readonly, nullable) NSNumber *parentID;
@property (nonatomic, readonly) NSNumber *startFrame;
@property (nonatomic, readonly) NSNumber *inFrame;
@property (nonatomic, readonly) NSNumber *outFrame;
@property (nonatomic, readonly) NSNumber *timeStretch;
@property (nonatomic, readonly) CGRect layerBounds;

@property (nonatomic, readonly, nullable) NSArray<LOTShapeGroup *> *shapes;
@property (nonatomic, readonly, nullable) NSArray<LOTMask *> *masks;

@property (nonatomic, readonly, nullable) NSNumber *layerWidth;
@property (nonatomic, readonly, nullable) NSNumber *layerHeight;
@property (nonatomic, readonly, nullable) UIColor *solidColor;
@property (nonatomic, readonly, nullable) LOTAsset *imageAsset;

@property (nonatomic, readonly) LOTKeyframeGroup *opacity;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *timeRemapping;
@property (nonatomic, readonly) LOTKeyframeGroup *rotation;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *position;

@property (nonatomic, readonly, nullable) LOTKeyframeGroup *positionX;
@property (nonatomic, readonly, nullable) LOTKeyframeGroup *positionY;

@property (nonatomic, readonly) LOTKeyframeGroup *anchor;
@property (nonatomic, readonly) LOTKeyframeGroup *scale;

@property (nonatomic, readonly) LOTMatteType matteType;

@end

NS_ASSUME_NONNULL_END
