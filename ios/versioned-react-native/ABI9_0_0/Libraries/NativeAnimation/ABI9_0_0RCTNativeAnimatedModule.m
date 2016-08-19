/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI9_0_0RCTNativeAnimatedModule.h"

#import "ABI9_0_0RCTAdditionAnimatedNode.h"
#import "ABI9_0_0RCTAnimationDriverNode.h"
#import "ABI9_0_0RCTAnimationUtils.h"
#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTInterpolationAnimatedNode.h"
#import "ABI9_0_0RCTLog.h"
#import "ABI9_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI9_0_0RCTPropsAnimatedNode.h"
#import "ABI9_0_0RCTStyleAnimatedNode.h"
#import "ABI9_0_0RCTTransformAnimatedNode.h"
#import "ABI9_0_0RCTValueAnimatedNode.h"

@implementation ABI9_0_0RCTNativeAnimatedModule
{
  NSMutableDictionary<NSNumber *, ABI9_0_0RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSNumber *, ABI9_0_0RCTAnimationDriverNode *> *_animationDrivers;
  NSMutableSet<ABI9_0_0RCTAnimationDriverNode *> *_activeAnimations;
  NSMutableSet<ABI9_0_0RCTAnimationDriverNode *> *_finishedAnimations;
  NSMutableSet<ABI9_0_0RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet<ABI9_0_0RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *_displayLink;
}

@synthesize bridge = _bridge;

ABI9_0_0RCT_EXPORT_MODULE()

- (void)setBridge:(ABI9_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _animationNodes = [NSMutableDictionary new];
  _animationDrivers = [NSMutableDictionary new];
  _activeAnimations = [NSMutableSet new];
  _finishedAnimations = [NSMutableSet new];
  _updatedValueNodes = [NSMutableSet new];
  _propAnimationNodes = [NSMutableSet new];
}

ABI9_0_0RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI9_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI9_0_0RCTValueAnimatedNode class],
            @"props" : [ABI9_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI9_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI9_0_0RCTAdditionAnimatedNode class],
            @"multiplication" : [ABI9_0_0RCTMultiplicationAnimatedNode class],
            @"transform" : [ABI9_0_0RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [ABI9_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI9_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI9_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  _animationNodes[tag] = node;

  if ([node isKindOfClass:[ABI9_0_0RCTPropsAnimatedNode class]]) {
    [_propAnimationNodes addObject:(ABI9_0_0RCTPropsAnimatedNode *)node];
  }
}

ABI9_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI9_0_0RCTAssertParam(parentTag);
  ABI9_0_0RCTAssertParam(childTag);

  ABI9_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI9_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI9_0_0RCTAssertParam(parentNode);
  ABI9_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

ABI9_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI9_0_0RCTAssertParam(parentTag);
  ABI9_0_0RCTAssertParam(childTag);

  ABI9_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI9_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI9_0_0RCTAssertParam(parentNode);
  ABI9_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

ABI9_0_0RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI9_0_0RCTResponseSenderBlock)callBack)
{
  if (ABI9_0_0RCT_DEBUG && ![config[@"type"] isEqual:@"frames"]) {
    ABI9_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  NSTimeInterval delay = [ABI9_0_0RCTConvert double:config[@"delay"]];
  NSNumber *toValue = [ABI9_0_0RCTConvert NSNumber:config[@"toValue"]] ?: @1;
  NSArray<NSNumber *> *frames = [ABI9_0_0RCTConvert NSNumberArray:config[@"frames"]];

  ABI9_0_0RCTValueAnimatedNode *valueNode = (ABI9_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  ABI9_0_0RCTAnimationDriverNode *animationDriver =
  [[ABI9_0_0RCTAnimationDriverNode alloc] initWithId:animationId
                                       delay:delay
                                     toValue:toValue.doubleValue
                                      frames:frames
                                     forNode:valueNode
                                    callBack:callBack];
  [_activeAnimations addObject:animationDriver];
  _animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimation];
}

ABI9_0_0RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  ABI9_0_0RCTAnimationDriverNode *driver = _animationDrivers[animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

ABI9_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  ABI9_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI9_0_0RCTValueAnimatedNode class]]) {
    ABI9_0_0RCTLogError(@"Not a value node.");
    return;
  }
  ABI9_0_0RCTValueAnimatedNode *valueNode = (ABI9_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

ABI9_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI9_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[ABI9_0_0RCTPropsAnimatedNode class]]) {
    [(ABI9_0_0RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

ABI9_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI9_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[ABI9_0_0RCTPropsAnimatedNode class]]) {
    [(ABI9_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

ABI9_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  ABI9_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[ABI9_0_0RCTValueAnimatedNode class]]) {
      [_updatedValueNodes removeObject:(ABI9_0_0RCTValueAnimatedNode *)node];
    } else if ([node isKindOfClass:[ABI9_0_0RCTPropsAnimatedNode class]]) {
      [_propAnimationNodes removeObject:(ABI9_0_0RCTPropsAnimatedNode *)node];
    }
  }
}

#pragma mark -- Animation Loop

- (void)startAnimation
{
  if (!_displayLink && _activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateAnimations)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)updateAnimations
{
  // Step Current active animations
  // This also recursively marks children nodes as needing update
  for (ABI9_0_0RCTAnimationDriverNode *animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (ABI9_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (ABI9_0_0RCTAnimationDriverNode *driverNode in _activeAnimations) {
    [driverNode cleanupAnimationUpdate];
  }
  for (ABI9_0_0RCTValueAnimatedNode *valueNode in _updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
  [_updatedValueNodes removeAllObjects];

  for (ABI9_0_0RCTAnimationDriverNode *driverNode in _activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [_finishedAnimations addObject:driverNode];
    }
  }
  for (ABI9_0_0RCTAnimationDriverNode *driverNode in _finishedAnimations) {
    [_activeAnimations removeObject:driverNode];
    [_animationDrivers removeObjectForKey:driverNode.animationId];
  }
  [_finishedAnimations removeAllObjects];

  if (_activeAnimations.count == 0) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

@end
