//
//  LOTStrokeRenderer.m
//  Lottie
//
//  Created by brandon_withrow on 7/17/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTStrokeRenderer.h"
#import "LOTColorInterpolator.h"
#import "LOTNumberInterpolator.h"

@implementation LOTStrokeRenderer {
  LOTColorInterpolator *_colorInterpolator;
  LOTNumberInterpolator *_opacityInterpolator;
  LOTNumberInterpolator *_widthInterpolator;
  LOTNumberInterpolator *_dashOffsetInterpolator;
  NSArray *_dashPatternInterpolators;
}

- (instancetype)initWithInputNode:(LOTAnimatorNode *)inputNode
                                shapeStroke:(LOTShapeStroke *)stroke {
  self = [super initWithInputNode:inputNode keyName:stroke.keyname];
  if (self) {
    _colorInterpolator = [[LOTColorInterpolator alloc] initWithKeyframes:stroke.color.keyframes];
    _opacityInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:stroke.opacity.keyframes];
    _widthInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:stroke.width.keyframes];
    
    NSMutableArray *dashPatternIntpolators = [NSMutableArray array];
    NSMutableArray *dashPatterns = [NSMutableArray array];
    for (LOTKeyframeGroup *keyframegroup in stroke.lineDashPattern) {
      LOTNumberInterpolator *interpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:keyframegroup.keyframes];
      [dashPatternIntpolators addObject:interpolator];
      if (dashPatterns && keyframegroup.keyframes.count == 1) {
        LOTKeyframe *first = keyframegroup.keyframes.firstObject;
        [dashPatterns addObject:@(first.floatValue)];
      }
      if (keyframegroup.keyframes.count > 1) {
        dashPatterns = nil;
      }
    }
    
    if (dashPatterns.count) {
      self.outputLayer.lineDashPattern = dashPatterns;
    } else {
      _dashPatternInterpolators = dashPatternIntpolators;
    }
    
    if (stroke.dashOffset) {
      _dashOffsetInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:stroke.dashOffset.keyframes];
    }
    
    self.outputLayer.fillColor = nil;
    self.outputLayer.lineCap = stroke.capType == LOTLineCapTypeRound ? kCALineCapRound : kCALineCapButt;
    switch (stroke.joinType) {
      case LOTLineJoinTypeBevel:
        self.outputLayer.lineJoin = kCALineJoinBevel;
        break;
      case LOTLineJoinTypeMiter:
        self.outputLayer.lineJoin = kCALineJoinMiter;
        break;
      case LOTLineJoinTypeRound:
        self.outputLayer.lineJoin = kCALineJoinRound;
        break;
      default:
        break;
    }
  }
  return self;
}

- (NSDictionary *)valueInterpolators {
  return @{@"Color" : _colorInterpolator,
           @"Opacity" : _opacityInterpolator,
           @"Stroke Width" : _widthInterpolator};
}

- (void)_updateLineDashPatternsForFrame:(NSNumber *)frame {
  if (_dashPatternInterpolators.count) {
    NSMutableArray *lineDashPatterns = [NSMutableArray array];
    CGFloat dashTotal = 0;
    for (LOTNumberInterpolator *interpolator in _dashPatternInterpolators) {
      CGFloat patternValue = [interpolator floatValueForFrame:frame];
      dashTotal = dashTotal + patternValue;
      [lineDashPatterns addObject:@(patternValue)];
    }
    if (dashTotal > 0) {
      self.outputLayer.lineDashPattern = lineDashPatterns;
    }
  }
}

- (BOOL)needsUpdateForFrame:(NSNumber *)frame {
  [self _updateLineDashPatternsForFrame:frame];
  BOOL dashOffset = NO;
  if (_dashOffsetInterpolator) {
    dashOffset = [_dashOffsetInterpolator hasUpdateForFrame:frame];
  }
  return (dashOffset ||
          [_colorInterpolator hasUpdateForFrame:frame] ||
          [_opacityInterpolator hasUpdateForFrame:frame] ||
          [_widthInterpolator hasUpdateForFrame:frame]);
}

- (void)performLocalUpdate {
  self.outputLayer.lineDashPhase = [_dashOffsetInterpolator floatValueForFrame:self.currentFrame];
  self.outputLayer.strokeColor = [_colorInterpolator colorForFrame:self.currentFrame];
  self.outputLayer.lineWidth = [_widthInterpolator floatValueForFrame:self.currentFrame];
  self.outputLayer.opacity = [_opacityInterpolator floatValueForFrame:self.currentFrame];
}

- (void)rebuildOutputs {
  self.outputLayer.path = self.inputNode.outputPath.CGPath;
}

- (NSDictionary *)actionsForRenderLayer {
  return @{@"strokeColor": [NSNull null],
           @"lineWidth": [NSNull null],
           @"opacity" : [NSNull null]};
}

@end
