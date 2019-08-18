//
//  LOTMaskContainer.m
//  Lottie
//
//  Created by brandon_withrow on 7/19/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTMaskContainer.h"
#import "LOTPathInterpolator.h"
#import "LOTNumberInterpolator.h"

@interface LOTMaskNodeLayer : CAShapeLayer

@property (nonatomic, readonly) LOTMask *maskNode;

- (instancetype)initWithMask:(LOTMask *)maskNode;
- (BOOL)hasUpdateForFrame:(NSNumber *)frame;

@end

@implementation LOTMaskNodeLayer {
  LOTPathInterpolator *_pathInterpolator;
  LOTNumberInterpolator *_opacityInterpolator;
  LOTNumberInterpolator *_expansionInterpolator;
}

- (instancetype)initWithMask:(LOTMask *)maskNode {
  self = [super init];
  if (self) {
    _pathInterpolator = [[LOTPathInterpolator alloc] initWithKeyframes:maskNode.maskPath.keyframes];
    _opacityInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:maskNode.opacity.keyframes];
    _expansionInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:maskNode.expansion.keyframes];
    _maskNode = maskNode;
    self.fillColor = [UIColor blueColor].CGColor;
  }
  return self;
}

- (void)updateForFrame:(NSNumber *)frame withViewBounds:(CGRect)viewBounds {
  if ([self hasUpdateForFrame:frame]) {
    LOTBezierPath *path = [_pathInterpolator pathForFrame:frame cacheLengths:NO];
    
    if (self.maskNode.maskMode == LOTMaskModeSubtract) {
      CGMutablePathRef pathRef = CGPathCreateMutable();
      CGPathAddRect(pathRef, NULL, viewBounds);
      CGPathAddPath(pathRef, NULL, path.CGPath);
      self.path = pathRef;
      self.fillRule = @"even-odd";
      CGPathRelease(pathRef);
    } else {
      self.path = path.CGPath;
    }
    
    self.opacity = [_opacityInterpolator floatValueForFrame:frame];
  }
}

- (BOOL)hasUpdateForFrame:(NSNumber *)frame {
  return ([_pathInterpolator hasUpdateForFrame:frame] ||
          [_opacityInterpolator hasUpdateForFrame:frame]);
}

@end

@implementation LOTMaskContainer {
  NSArray<LOTMaskNodeLayer *> *_masks;
}

- (instancetype)initWithMasks:(NSArray<LOTMask *> *)masks {
  self = [super init];
  if (self) {
    NSMutableArray *maskNodes = [NSMutableArray array];
    CALayer *containerLayer = [CALayer layer];
    
    for (LOTMask *mask in masks) {
      LOTMaskNodeLayer *node = [[LOTMaskNodeLayer alloc] initWithMask:mask];
      [maskNodes addObject:node];
      if (mask.maskMode == LOTMaskModeAdd ||
          mask == masks.firstObject) {
        [containerLayer addSublayer:node];
      } else {
        containerLayer.mask = node;
        CALayer *newContainer = [CALayer layer];
        [newContainer addSublayer:containerLayer];
        containerLayer = newContainer;
      }
    }
    [self addSublayer:containerLayer];
    _masks = maskNodes;

  }
  return self;
}

- (void)setCurrentFrame:(NSNumber *)currentFrame {
  if (_currentFrame == currentFrame) {
    return;
  }
  _currentFrame = currentFrame;
  
  for (LOTMaskNodeLayer *nodeLayer in _masks) {
    [nodeLayer updateForFrame:currentFrame withViewBounds:self.bounds];
  }
}

@end
