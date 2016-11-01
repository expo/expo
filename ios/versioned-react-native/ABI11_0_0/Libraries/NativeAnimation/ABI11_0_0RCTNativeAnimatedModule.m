/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI11_0_0RCTNativeAnimatedModule.h"

#import "ABI11_0_0RCTAdditionAnimatedNode.h"
#import "ABI11_0_0RCTAnimationDriver.h"
#import "ABI11_0_0RCTFrameAnimation.h"
#import "ABI11_0_0RCTSpringAnimation.h"
#import "ABI11_0_0RCTAnimationUtils.h"
#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTEventAnimationDriver.h"
#import "ABI11_0_0RCTInterpolationAnimatedNode.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTDiffClampAnimatedNode.h"
#import "ABI11_0_0RCTDivisionAnimatedNode.h"
#import "ABI11_0_0RCTModuloAnimatedNode.h"
#import "ABI11_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI11_0_0RCTPropsAnimatedNode.h"
#import "ABI11_0_0RCTStyleAnimatedNode.h"
#import "ABI11_0_0RCTTransformAnimatedNode.h"
#import "ABI11_0_0RCTValueAnimatedNode.h"

@implementation ABI11_0_0RCTNativeAnimatedModule
{
  NSMutableDictionary<NSNumber *, ABI11_0_0RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSNumber *, id<ABI11_0_0RCTAnimationDriver>> *_animationDrivers;
  NSMutableDictionary<NSString *, ABI11_0_0RCTEventAnimationDriver *> *_eventAnimationDrivers;
  NSMutableSet<id<ABI11_0_0RCTAnimationDriver>> *_activeAnimations;
  NSMutableSet<id<ABI11_0_0RCTAnimationDriver>> *_finishedAnimations;
  NSMutableSet<ABI11_0_0RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet<ABI11_0_0RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *_displayLink;
}

ABI11_0_0RCT_EXPORT_MODULE()

- (void)setBridge:(ABI11_0_0RCTBridge *)bridge
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

ABI11_0_0RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI11_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI11_0_0RCTValueAnimatedNode class],
            @"props" : [ABI11_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI11_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI11_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI11_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI11_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI11_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI11_0_0RCTModuloAnimatedNode class],
            @"transform" : [ABI11_0_0RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [ABI11_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI11_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI11_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];

  _animationNodes[tag] = node;

  if ([node isKindOfClass:[ABI11_0_0RCTPropsAnimatedNode class]]) {
    [_propAnimationNodes addObject:(ABI11_0_0RCTPropsAnimatedNode *)node];
  }
}

ABI11_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI11_0_0RCTAssertParam(parentTag);
  ABI11_0_0RCTAssertParam(childTag);

  ABI11_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI11_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI11_0_0RCTAssertParam(parentNode);
  ABI11_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

ABI11_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI11_0_0RCTAssertParam(parentTag);
  ABI11_0_0RCTAssertParam(childTag);

  ABI11_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI11_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI11_0_0RCTAssertParam(parentNode);
  ABI11_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

ABI11_0_0RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI11_0_0RCTResponseSenderBlock)callBack)
{
  ABI11_0_0RCTValueAnimatedNode *valueNode = (ABI11_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI11_0_0RCTAnimationDriver>animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI11_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI11_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else {
    ABI11_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  _animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

ABI11_0_0RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  id<ABI11_0_0RCTAnimationDriver>driver = _animationDrivers[animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

ABI11_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ABI11_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI11_0_0RCTValueAnimatedNode *valueNode = (ABI11_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

ABI11_0_0RCT_EXPORT_METHOD(setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                  offset:(nonnull NSNumber *)offset)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ABI11_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI11_0_0RCTValueAnimatedNode *valueNode = (ABI11_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [_updatedValueNodes addObject:valueNode];
}

ABI11_0_0RCT_EXPORT_METHOD(flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ABI11_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI11_0_0RCTValueAnimatedNode *valueNode = (ABI11_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

ABI11_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[ABI11_0_0RCTPropsAnimatedNode class]]) {
    [(ABI11_0_0RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

ABI11_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[ABI11_0_0RCTPropsAnimatedNode class]]) {
    [(ABI11_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

ABI11_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
      [_updatedValueNodes removeObject:(ABI11_0_0RCTValueAnimatedNode *)node];
    } else if ([node isKindOfClass:[ABI11_0_0RCTPropsAnimatedNode class]]) {
      [_propAnimationNodes removeObject:(ABI11_0_0RCTPropsAnimatedNode *)node];
    }
  }
}

ABI11_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ((ABI11_0_0RCTValueAnimatedNode *)node).valueObserver = self;
  }
}

ABI11_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ((ABI11_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}

ABI11_0_0RCT_EXPORT_METHOD(addAnimatedEventToView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping)
{
  NSNumber *nodeTag = [ABI11_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI11_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI11_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI11_0_0RCTValueAnimatedNode class]]) {
    ABI11_0_0RCTLogError(@"Animated node connected to event should be of type ABI11_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI11_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI11_0_0RCTEventAnimationDriver *driver =
  [[ABI11_0_0RCTEventAnimationDriver alloc] initWithEventPath:eventPath valueNode:(ABI11_0_0RCTValueAnimatedNode *)node];

  [_eventAnimationDrivers setObject:driver forKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

ABI11_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName)
{
  [_eventAnimationDrivers removeObjectForKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

- (void)animatedNode:(ABI11_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}

- (BOOL)eventDispatcherWillDispatchEvent:(id<ABI11_0_0RCTEvent>)event
{
  // Native animated events only work for events dispatched from the main queue.
  if (!ABI11_0_0RCTIsMainQueue() || [_eventAnimationDrivers count] == 0) {
    return NO;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", [event viewTag], [event eventName]];
  ABI11_0_0RCTEventAnimationDriver *driver = [_eventAnimationDrivers valueForKey:key];

  if (driver) {
    [driver updateWithEvent:event];

    for (ABI11_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
      [propsNode updateNodeIfNecessary];
    }

    [driver.valueNode cleanupAnimationUpdate];

    return YES;
  }

  return NO;
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
  for (id<ABI11_0_0RCTAnimationDriver>animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (ABI11_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (id<ABI11_0_0RCTAnimationDriver>driverNode in _activeAnimations) {
    [driverNode cleanupAnimationUpdate];
  }
  for (ABI11_0_0RCTValueAnimatedNode *valueNode in _updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
  [_updatedValueNodes removeAllObjects];

  for (id<ABI11_0_0RCTAnimationDriver>driverNode in _activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [_finishedAnimations addObject:driverNode];
    }
  }
  for (id<ABI11_0_0RCTAnimationDriver>driverNode in _finishedAnimations) {
    [_activeAnimations removeObject:driverNode];
    [_animationDrivers removeObjectForKey:driverNode.animationId];
  }
  [_finishedAnimations removeAllObjects];

  [self stopAnimationLoopIfNeeded];
}

@end
