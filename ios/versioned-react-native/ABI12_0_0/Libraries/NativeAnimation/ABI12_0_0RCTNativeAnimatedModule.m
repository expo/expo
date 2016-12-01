/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI12_0_0RCTNativeAnimatedModule.h"

#import "ABI12_0_0RCTAdditionAnimatedNode.h"
#import "ABI12_0_0RCTAnimationDriver.h"
#import "ABI12_0_0RCTFrameAnimation.h"
#import "ABI12_0_0RCTSpringAnimation.h"
#import "ABI12_0_0RCTAnimationUtils.h"
#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTEventAnimation.h"
#import "ABI12_0_0RCTInterpolationAnimatedNode.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTDiffClampAnimatedNode.h"
#import "ABI12_0_0RCTDivisionAnimatedNode.h"
#import "ABI12_0_0RCTModuloAnimatedNode.h"
#import "ABI12_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI12_0_0RCTPropsAnimatedNode.h"
#import "ABI12_0_0RCTStyleAnimatedNode.h"
#import "ABI12_0_0RCTTransformAnimatedNode.h"
#import "ABI12_0_0RCTValueAnimatedNode.h"

@implementation ABI12_0_0RCTNativeAnimatedModule
{
  NSMutableDictionary<NSNumber *, ABI12_0_0RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSNumber *, id<ABI12_0_0RCTAnimationDriver>> *_animationDrivers;
  NSMutableDictionary<NSString *, ABI12_0_0RCTEventAnimation *> *_eventAnimationDrivers;
  NSMutableSet<id<ABI12_0_0RCTAnimationDriver>> *_activeAnimations;
  NSMutableSet<id<ABI12_0_0RCTAnimationDriver>> *_finishedAnimations;
  NSMutableSet<ABI12_0_0RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet<ABI12_0_0RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *_displayLink;
}

ABI12_0_0RCT_EXPORT_MODULE()

- (void)setBridge:(ABI12_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _animationNodes = [NSMutableDictionary new];
  _animationDrivers = [NSMutableDictionary new];
  _eventAnimationDrivers = [NSMutableDictionary new];
  _activeAnimations = [NSMutableSet new];
  _finishedAnimations = [NSMutableSet new];
  _updatedValueNodes = [NSMutableSet new];
  _propAnimationNodes = [NSMutableSet new];

  [bridge.eventDispatcher addDispatchObserver:self];
}

- (void)dealloc
{
  [self.bridge.eventDispatcher removeDispatchObserver:self];
}


- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAnimatedValueUpdate"];
}

ABI12_0_0RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI12_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI12_0_0RCTValueAnimatedNode class],
            @"props" : [ABI12_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI12_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI12_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI12_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI12_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI12_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI12_0_0RCTModuloAnimatedNode class],
            @"transform" : [ABI12_0_0RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [ABI12_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI12_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI12_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];

  _animationNodes[tag] = node;

  if ([node isKindOfClass:[ABI12_0_0RCTPropsAnimatedNode class]]) {
    [_propAnimationNodes addObject:(ABI12_0_0RCTPropsAnimatedNode *)node];
  }
}

ABI12_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI12_0_0RCTAssertParam(parentTag);
  ABI12_0_0RCTAssertParam(childTag);

  ABI12_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI12_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI12_0_0RCTAssertParam(parentNode);
  ABI12_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

ABI12_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI12_0_0RCTAssertParam(parentTag);
  ABI12_0_0RCTAssertParam(childTag);

  ABI12_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI12_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI12_0_0RCTAssertParam(parentNode);
  ABI12_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

ABI12_0_0RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI12_0_0RCTResponseSenderBlock)callBack)
{
  ABI12_0_0RCTValueAnimatedNode *valueNode = (ABI12_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI12_0_0RCTAnimationDriver>animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI12_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI12_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else {
    ABI12_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  _animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

ABI12_0_0RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  id<ABI12_0_0RCTAnimationDriver>driver = _animationDrivers[animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

ABI12_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ABI12_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI12_0_0RCTValueAnimatedNode *valueNode = (ABI12_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];

  [self updateViewsProps];

  [valueNode cleanupAnimationUpdate];
}

ABI12_0_0RCT_EXPORT_METHOD(setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                  offset:(nonnull NSNumber *)offset)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ABI12_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI12_0_0RCTValueAnimatedNode *valueNode = (ABI12_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [_updatedValueNodes addObject:valueNode];
}

ABI12_0_0RCT_EXPORT_METHOD(flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ABI12_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI12_0_0RCTValueAnimatedNode *valueNode = (ABI12_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

ABI12_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[ABI12_0_0RCTPropsAnimatedNode class]]) {
    [(ABI12_0_0RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

ABI12_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[ABI12_0_0RCTPropsAnimatedNode class]]) {
    [(ABI12_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

ABI12_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
      [_updatedValueNodes removeObject:(ABI12_0_0RCTValueAnimatedNode *)node];
    } else if ([node isKindOfClass:[ABI12_0_0RCTPropsAnimatedNode class]]) {
      [_propAnimationNodes removeObject:(ABI12_0_0RCTPropsAnimatedNode *)node];
    }
  }
}

ABI12_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ((ABI12_0_0RCTValueAnimatedNode *)node).valueObserver = self;
  }
}

ABI12_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ((ABI12_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}

ABI12_0_0RCT_EXPORT_METHOD(addAnimatedEventToView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping)
{
  NSNumber *nodeTag = [ABI12_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI12_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI12_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI12_0_0RCTValueAnimatedNode class]]) {
    ABI12_0_0RCTLogError(@"Animated node connected to event should be of type ABI12_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI12_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI12_0_0RCTEventAnimation *driver =
  [[ABI12_0_0RCTEventAnimation alloc] initWithEventPath:eventPath valueNode:(ABI12_0_0RCTValueAnimatedNode *)node];

  _eventAnimationDrivers[[NSString stringWithFormat:@"%@%@", viewTag, eventName]] = driver;
}

ABI12_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName)
{
  [_eventAnimationDrivers removeObjectForKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

- (void)animatedNode:(ABI12_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}

- (BOOL)eventDispatcherWillDispatchEvent:(id<ABI12_0_0RCTEvent>)event
{
  // Native animated events only work for events dispatched from the main queue.
  if (!ABI12_0_0RCTIsMainQueue() || _eventAnimationDrivers.count == 0) {
    return NO;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI12_0_0RCTEventAnimation *driver = _eventAnimationDrivers[key];

  if (driver) {
    [driver updateWithEvent:event];
    [self updateViewsProps];
    [driver.valueNode cleanupAnimationUpdate];

    return YES;
  }

  return NO;
}

- (void)updateViewsProps
{
  for (ABI12_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }
}

#pragma mark -- Animation Loop

- (void)startAnimationLoopIfNeeded
{
  if (!_displayLink && (_activeAnimations.count > 0 || _updatedValueNodes.count > 0)) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateAnimations)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)stopAnimationLoopIfNeeded
{
  if (_displayLink && _activeAnimations.count == 0 && _updatedValueNodes.count == 0) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)updateAnimations
{
  // Step Current active animations
  // This also recursively marks children nodes as needing update
  for (id<ABI12_0_0RCTAnimationDriver>animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (ABI12_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (id<ABI12_0_0RCTAnimationDriver>driverNode in _activeAnimations) {
    [driverNode cleanupAnimationUpdate];
  }
  for (ABI12_0_0RCTValueAnimatedNode *valueNode in _updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
  [_updatedValueNodes removeAllObjects];

  for (id<ABI12_0_0RCTAnimationDriver>driverNode in _activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [_finishedAnimations addObject:driverNode];
    }
  }
  for (id<ABI12_0_0RCTAnimationDriver>driverNode in _finishedAnimations) {
    [_activeAnimations removeObject:driverNode];
    [_animationDrivers removeObjectForKey:driverNode.animationId];
  }
  [_finishedAnimations removeAllObjects];

  [self stopAnimationLoopIfNeeded];
}

@end
