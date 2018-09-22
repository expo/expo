//
//  LOTRenderGroup.m
//  Lottie
//
//  Created by brandon_withrow on 6/27/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTRenderGroup.h"
#import "LOTModels.h"
#import "LOTPathAnimator.h"
#import "LOTFillRenderer.h"
#import "LOTStrokeRenderer.h"
#import "LOTNumberInterpolator.h"
#import "LOTTransformInterpolator.h"
#import "LOTCircleAnimator.h"
#import "LOTRoundedRectAnimator.h"
#import "LOTTrimPathNode.h"
#import "LOTShapeStar.h"
#import "LOTPolygonAnimator.h"
#import "LOTPolystarAnimator.h"
#import "LOTShapeGradientFill.h"
#import "LOTGradientFillRender.h"
#import "LOTRepeaterRenderer.h"
#import "LOTShapeRepeater.h"

@implementation LOTRenderGroup {
  LOTAnimatorNode *_rootNode;
  LOTBezierPath *_outputPath;
  LOTBezierPath *_localPath;
  BOOL _rootNodeHasUpdate;
  LOTNumberInterpolator *_opacityInterpolator;
  LOTTransformInterpolator *_transformInterolator;
}

- (instancetype _Nonnull)initWithInputNode:(LOTAnimatorNode * _Nullable)inputNode
                                   contents:(NSArray * _Nonnull)contents
                                    keyname:(NSString * _Nullable)keyname {
  self = [super initWithInputNode:inputNode keyName:keyname];
  if (self) {
    _containerLayer = [CALayer layer];
    _containerLayer.actions = @{@"transform": [NSNull null],
                                @"opacity": [NSNull null]};
    [self buildContents:contents];
  }
  return self;
}

- (NSDictionary *)valueInterpolators {
  if (_opacityInterpolator && _transformInterolator) {
    return @{@"Opacity" : _opacityInterpolator,
             @"Position" : _transformInterolator.positionInterpolator,
             @"Scale" : _transformInterolator.scaleInterpolator,
             @"Rotation" : _transformInterolator.scaleInterpolator,
             @"Anchor Point" : _transformInterolator.anchorInterpolator,
             // Deprecated
             @"Transform.Opacity" : _opacityInterpolator,
             @"Transform.Position" : _transformInterolator.positionInterpolator,
             @"Transform.Scale" : _transformInterolator.scaleInterpolator,
             @"Transform.Rotation" : _transformInterolator.scaleInterpolator,
             @"Transform.Anchor Point" : _transformInterolator.anchorInterpolator
             };
  }
  return nil;
}

- (void)buildContents:(NSArray *)contents {
  LOTAnimatorNode *previousNode = nil;
  LOTShapeTransform *transform;
  for (id item in contents) {
    if ([item isKindOfClass:[LOTShapeFill class]]) {
      LOTFillRenderer *fillRenderer = [[LOTFillRenderer alloc] initWithInputNode:previousNode
                                                                       shapeFill:(LOTShapeFill *)item];
      [self.containerLayer insertSublayer:fillRenderer.outputLayer atIndex:0];
      previousNode = fillRenderer;
    } else if ([item isKindOfClass:[LOTShapeStroke class]]) {
      LOTStrokeRenderer *strokRenderer = [[LOTStrokeRenderer alloc] initWithInputNode:previousNode
                                                                          shapeStroke:(LOTShapeStroke *)item];
      [self.containerLayer insertSublayer:strokRenderer.outputLayer atIndex:0];
      previousNode = strokRenderer;
    } else if ([item isKindOfClass:[LOTShapePath class]]) {
      LOTPathAnimator *pathAnimator = [[LOTPathAnimator alloc] initWithInputNode:previousNode
                                                                       shapePath:(LOTShapePath *)item];
      previousNode = pathAnimator;
    } else if ([item isKindOfClass:[LOTShapeRectangle class]]) {
      LOTRoundedRectAnimator *rectAnimator = [[LOTRoundedRectAnimator alloc] initWithInputNode:previousNode
                                                                                shapeRectangle:(LOTShapeRectangle *)item];
      previousNode = rectAnimator;
    } else if ([item isKindOfClass:[LOTShapeCircle class]]) {
      LOTCircleAnimator *circleAnimator = [[LOTCircleAnimator alloc] initWithInputNode:previousNode
                                                                           shapeCircle:(LOTShapeCircle *)item];
      previousNode = circleAnimator;
    } else if ([item isKindOfClass:[LOTShapeGroup class]]) {
      LOTShapeGroup *shapeGroup = (LOTShapeGroup *)item;
      LOTRenderGroup *renderGroup = [[LOTRenderGroup alloc] initWithInputNode:previousNode contents:shapeGroup.items keyname:shapeGroup.keyname];
      [self.containerLayer insertSublayer:renderGroup.containerLayer atIndex:0];
      previousNode = renderGroup;
    } else if ([item isKindOfClass:[LOTShapeTransform class]]) {
      transform = (LOTShapeTransform *)item;
    } else if ([item isKindOfClass:[LOTShapeTrimPath class]]) {
      LOTTrimPathNode *trim = [[LOTTrimPathNode alloc] initWithInputNode:previousNode trimPath:(LOTShapeTrimPath *)item];
      previousNode = trim;
    } else if ([item isKindOfClass:[LOTShapeStar class]]) {
      LOTShapeStar *star = (LOTShapeStar *)item;
      if (star.type == LOTPolystarShapeStar) {
        LOTPolystarAnimator *starAnimator = [[LOTPolystarAnimator alloc] initWithInputNode:previousNode shapeStar:star];
        previousNode = starAnimator;
      }
      if (star.type == LOTPolystarShapePolygon) {
        LOTPolygonAnimator *polygonAnimator = [[LOTPolygonAnimator alloc] initWithInputNode:previousNode shapePolygon:star];
        previousNode = polygonAnimator;
      }
    } else if ([item isKindOfClass:[LOTShapeGradientFill class]]) {
      LOTGradientFillRender *gradientFill = [[LOTGradientFillRender alloc] initWithInputNode:previousNode shapeGradientFill:(LOTShapeGradientFill *)item];
      previousNode = gradientFill;
      [self.containerLayer insertSublayer:gradientFill.outputLayer atIndex:0];
    } else if ([item isKindOfClass:[LOTShapeRepeater class]]) {
      LOTRepeaterRenderer *repeater = [[LOTRepeaterRenderer alloc] initWithInputNode:previousNode shapeRepeater:(LOTShapeRepeater *)item];
      previousNode = repeater;
      [self.containerLayer insertSublayer:repeater.outputLayer atIndex:0];
    }
  }
  if (transform) {
    _opacityInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:transform.opacity.keyframes];
    _transformInterolator = [[LOTTransformInterpolator alloc] initWithPosition:transform.position.keyframes
                                                                      rotation:transform.rotation.keyframes
                                                                        anchor:transform.anchor.keyframes
                                                                         scale:transform.scale.keyframes];
  }
  _rootNode = previousNode;
}

- (BOOL)needsUpdateForFrame:(NSNumber *)frame {
  return ([_opacityInterpolator hasUpdateForFrame:frame] ||
          [_transformInterolator hasUpdateForFrame:frame] ||
          _rootNodeHasUpdate);

}

- (BOOL)updateWithFrame:(NSNumber *)frame withModifierBlock:(void (^ _Nullable)(LOTAnimatorNode * _Nonnull))modifier forceLocalUpdate:(BOOL)forceUpdate {
  indentation_level = indentation_level + 1;
  _rootNodeHasUpdate = [_rootNode updateWithFrame:frame withModifierBlock:modifier forceLocalUpdate:forceUpdate];
  indentation_level = indentation_level - 1;
  BOOL update = [super updateWithFrame:frame withModifierBlock:modifier forceLocalUpdate:forceUpdate];
  return update;
}

- (void)performLocalUpdate {
  if (_opacityInterpolator) {
    self.containerLayer.opacity = [_opacityInterpolator floatValueForFrame:self.currentFrame];
  }
  if (_transformInterolator) {
    CATransform3D xform = [_transformInterolator transformForFrame:self.currentFrame];
    self.containerLayer.transform = xform;
    
    CGAffineTransform appliedXform = CATransform3DGetAffineTransform(xform);
    _localPath = [_rootNode.outputPath copy];
    [_localPath LOT_applyTransform:appliedXform];
  } else {
    _localPath = [_rootNode.outputPath copy];
  }
}

- (void)rebuildOutputs {
  if (self.inputNode) {
    _outputPath = [self.inputNode.outputPath copy];
    [_outputPath LOT_appendPath:self.localPath];
  } else {
    _outputPath = self.localPath;
  }
}

- (void)setPathShouldCacheLengths:(BOOL)pathShouldCacheLengths {
  [super setPathShouldCacheLengths:pathShouldCacheLengths];
  _rootNode.pathShouldCacheLengths = pathShouldCacheLengths;
}

- (LOTBezierPath *)localPath {
  return _localPath;
}

- (LOTBezierPath *)outputPath {
  return _outputPath;
}

- (void)searchNodesForKeypath:(LOTKeypath * _Nonnull)keypath {
  [self.inputNode searchNodesForKeypath:keypath];
  if ([keypath pushKey:self.keyname]) {
    // Matches self. Dig deeper.
    // Check interpolators

    if ([keypath pushKey:@"Transform"]) {
      // Matches a Transform interpolator!
      if (self.valueInterpolators[keypath.currentKey] != nil) {
        [keypath pushKey:keypath.currentKey];
        [keypath addSearchResultForCurrentPath:self];
        [keypath popKey];
      }
      [keypath popKey];
    }

    if (keypath.endOfKeypath) {
      // We have a match!
      [keypath addSearchResultForCurrentPath:self];
    }
    // Check child nodes
    [_rootNode searchNodesForKeypath:keypath];
    [keypath popKey];
  }
}

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate
              forKeypath:(LOTKeypath * _Nonnull)keypath {
  if ([keypath pushKey:self.keyname]) {
    // Matches self. Dig deeper.
    // Check interpolators
    if ([keypath pushKey:@"Transform"]) {
      // Matches a Transform interpolator!
      LOTValueInterpolator *interpolator = self.valueInterpolators[keypath.currentKey];
      if (interpolator) {
        // We have a match!
        [interpolator setValueDelegate:delegate];
      }
      [keypath popKey];
    }

    // Check child nodes
    [_rootNode setValueDelegate:delegate forKeypath:keypath];

    [keypath popKey];
  }

  // Check upstream
  [self.inputNode setValueDelegate:delegate forKeypath:keypath];
}

@end
