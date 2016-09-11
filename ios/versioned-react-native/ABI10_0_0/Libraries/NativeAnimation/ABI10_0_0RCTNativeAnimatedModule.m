/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#import "ABI10_0_0RCTNativeAnimatedModule.h"

#import "ABI10_0_0RCTAdditionAnimatedNode.h"
#import "ABI10_0_0RCTAnimationDriverNode.h"
#import "ABI10_0_0RCTAnimationUtils.h"
#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTEventAnimationDriver.h"
#import "ABI10_0_0RCTInterpolationAnimatedNode.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTDiffClampAnimatedNode.h"
#import "ABI10_0_0RCTModuloAnimatedNode.h"
#import "ABI10_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI10_0_0RCTPropsAnimatedNode.h"
#import "ABI10_0_0RCTStyleAnimatedNode.h"
#import "ABI10_0_0RCTTransformAnimatedNode.h"
#import "ABI10_0_0RCTValueAnimatedNode.h"

@implementation ABI10_0_0RCTNativeAnimatedModule
{
  NSMutableDictionary<NSNumber *, ABI10_0_0RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSNumber *, ABI10_0_0RCTAnimationDriverNode *> *_animationDrivers;
  NSMutableDictionary<NSString *, ABI10_0_0RCTEventAnimationDriver *> *_eventAnimationDrivers;
  NSMutableSet<ABI10_0_0RCTAnimationDriverNode *> *_activeAnimations;
  NSMutableSet<ABI10_0_0RCTAnimationDriverNode *> *_finishedAnimations;
  NSMutableSet<ABI10_0_0RCTValueAnimatedNode *> *_updatedValueNodes;
  NSMutableSet<ABI10_0_0RCTPropsAnimatedNode *> *_propAnimationNodes;
  CADisplayLink *_displayLink;
}

ABI10_0_0RCT_EXPORT_MODULE()

- (void)setBridge:(ABI10_0_0RCTBridge *)bridge
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

ABI10_0_0RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI10_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI10_0_0RCTValueAnimatedNode class],
            @"props" : [ABI10_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI10_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI10_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI10_0_0RCTDiffClampAnimatedNode class],
            @"multiplication" : [ABI10_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI10_0_0RCTModuloAnimatedNode class],
            @"transform" : [ABI10_0_0RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [ABI10_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI10_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI10_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  _animationNodes[tag] = node;

  if ([node isKindOfClass:[ABI10_0_0RCTPropsAnimatedNode class]]) {
    [_propAnimationNodes addObject:(ABI10_0_0RCTPropsAnimatedNode *)node];
  }
}

ABI10_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI10_0_0RCTAssertParam(parentTag);
  ABI10_0_0RCTAssertParam(childTag);

  ABI10_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI10_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI10_0_0RCTAssertParam(parentNode);
  ABI10_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

ABI10_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  ABI10_0_0RCTAssertParam(parentTag);
  ABI10_0_0RCTAssertParam(childTag);

  ABI10_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI10_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI10_0_0RCTAssertParam(parentNode);
  ABI10_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

ABI10_0_0RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI10_0_0RCTResponseSenderBlock)callBack)
{
  if (ABI10_0_0RCT_DEBUG && ![config[@"type"] isEqual:@"frames"]) {
    ABI10_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  NSTimeInterval delay = [ABI10_0_0RCTConvert double:config[@"delay"]];
  NSNumber *toValue = [ABI10_0_0RCTConvert NSNumber:config[@"toValue"]] ?: @1;
  NSArray<NSNumber *> *frames = [ABI10_0_0RCTConvert NSNumberArray:config[@"frames"]];

  ABI10_0_0RCTValueAnimatedNode *valueNode = (ABI10_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  ABI10_0_0RCTAnimationDriverNode *animationDriver =
  [[ABI10_0_0RCTAnimationDriverNode alloc] initWithId:animationId
                                       delay:delay
                                     toValue:toValue.doubleValue
                                      frames:frames
                                     forNode:valueNode
                                    callBack:callBack];
  [_activeAnimations addObject:animationDriver];
  _animationDrivers[animationId] = animationDriver;
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

ABI10_0_0RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  ABI10_0_0RCTAnimationDriverNode *driver = _animationDrivers[animationId];
  if (driver) {
    [driver removeAnimation];
    [_animationDrivers removeObjectForKey:animationId];
    [_activeAnimations removeObject:driver];
    [_finishedAnimations removeObject:driver];
  }
}

ABI10_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
    ABI10_0_0RCTLogError(@"Not a value node.");
    return;
  }
  ABI10_0_0RCTValueAnimatedNode *valueNode = (ABI10_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

ABI10_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && [node isKindOfClass:[ABI10_0_0RCTPropsAnimatedNode class]]) {
    [(ABI10_0_0RCTPropsAnimatedNode *)node connectToView:viewTag animatedModule:self];
  }
}

ABI10_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (viewTag && node && [node isKindOfClass:[ABI10_0_0RCTPropsAnimatedNode class]]) {
    [(ABI10_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

ABI10_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
    if ([node isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
      [_updatedValueNodes removeObject:(ABI10_0_0RCTValueAnimatedNode *)node];
    } else if ([node isKindOfClass:[ABI10_0_0RCTPropsAnimatedNode class]]) {
      [_propAnimationNodes removeObject:(ABI10_0_0RCTPropsAnimatedNode *)node];
    }
  }
}

ABI10_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
    ((ABI10_0_0RCTValueAnimatedNode *)node).valueObserver = self;
  }
}

ABI10_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node && [node isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
    ((ABI10_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}

ABI10_0_0RCT_EXPORT_METHOD(addAnimatedEventToView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping)
{
  NSNumber *nodeTag = [ABI10_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI10_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI10_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI10_0_0RCTValueAnimatedNode class]]) {
    ABI10_0_0RCTLogError(@"Animated node connected to event should be of type ABI10_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI10_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI10_0_0RCTEventAnimationDriver *driver =
  [[ABI10_0_0RCTEventAnimationDriver alloc] initWithEventPath:eventPath valueNode:(ABI10_0_0RCTValueAnimatedNode *)node];

  [_eventAnimationDrivers setObject:driver forKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

ABI10_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName)
{
  [_eventAnimationDrivers removeObjectForKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

- (void)animatedNode:(ABI10_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}

- (BOOL)eventDispatcherWillDispatchEvent:(id<ABI10_0_0RCTEvent>)event
{
  // Native animated events only work for events dispatched from the main queue.
  if (!ABI10_0_0RCTIsMainQueue() || [_eventAnimationDrivers count] == 0) {
    return NO;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", [event viewTag], [event eventName]];
  ABI10_0_0RCTEventAnimationDriver *driver = [_eventAnimationDrivers valueForKey:key];

  if (driver) {
    [driver updateWithEvent:event];
    [_updatedValueNodes addObject:driver.valueNode];
    [self updateAnimations];
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
  for (ABI10_0_0RCTAnimationDriverNode *animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  // Perform node updates for marked nodes.
  // At this point all nodes that are in need of an update are properly marked as such.
  for (ABI10_0_0RCTPropsAnimatedNode *propsNode in _propAnimationNodes) {
    [propsNode updateNodeIfNecessary];
  }

  // Cleanup nodes and prepare for next cycle. Remove updated nodes from bucket.
  for (ABI10_0_0RCTAnimationDriverNode *driverNode in _activeAnimations) {
    [driverNode cleanupAnimationUpdate];
  }
  for (ABI10_0_0RCTValueAnimatedNode *valueNode in _updatedValueNodes) {
    [valueNode cleanupAnimationUpdate];
  }
  [_updatedValueNodes removeAllObjects];

  for (ABI10_0_0RCTAnimationDriverNode *driverNode in _activeAnimations) {
    if (driverNode.animationHasFinished) {
      [driverNode removeAnimation];
      [_finishedAnimations addObject:driverNode];
    }
  }
  for (ABI10_0_0RCTAnimationDriverNode *driverNode in _finishedAnimations) {
    [_activeAnimations removeObject:driverNode];
    [_animationDrivers removeObjectForKey:driverNode.animationId];
  }
  [_finishedAnimations removeAllObjects];
  
  [self stopAnimationLoopIfNeeded];
}

@end
