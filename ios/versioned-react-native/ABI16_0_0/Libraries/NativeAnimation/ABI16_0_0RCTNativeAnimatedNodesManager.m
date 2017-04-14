/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTNativeAnimatedNodesManager.h"

#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>

#import "ABI16_0_0RCTAnimatedNode.h"
#import "ABI16_0_0RCTAnimationDriver.h"
#import "ABI16_0_0RCTEventAnimation.h"

#import "ABI16_0_0RCTAdditionAnimatedNode.h"
#import "ABI16_0_0RCTInterpolationAnimatedNode.h"
#import "ABI16_0_0RCTDiffClampAnimatedNode.h"
#import "ABI16_0_0RCTDivisionAnimatedNode.h"
#import "ABI16_0_0RCTModuloAnimatedNode.h"
#import "ABI16_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI16_0_0RCTModuloAnimatedNode.h"
#import "ABI16_0_0RCTPropsAnimatedNode.h"
#import "ABI16_0_0RCTStyleAnimatedNode.h"
#import "ABI16_0_0RCTTransformAnimatedNode.h"
#import "ABI16_0_0RCTValueAnimatedNode.h"
#import "ABI16_0_0RCTFrameAnimation.h"
#import "ABI16_0_0RCTSpringAnimation.h"

@implementation ABI16_0_0RCTNativeAnimatedNodesManager
{
  ABI16_0_0RCTUIManager *_uiManager;
  NSMutableDictionary<NSNumber *, ABI16_0_0RCTAnimatedNode *> *_animationNodes;
  NSMutableDictionary<NSString *, ABI16_0_0RCTEventAnimation *> *_eventDrivers;
  NSMutableSet<id<ABI16_0_0RCTAnimationDriver>> *_activeAnimations;
  CADisplayLink *_displayLink;
}

- (instancetype)initWithUIManager:(nonnull ABI16_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _uiManager = uiManager;
    _animationNodes = [NSMutableDictionary new];
    _eventDrivers = [NSMutableDictionary new];
    _activeAnimations = [NSMutableSet new];
  }
  return self;
}

#pragma mark -- Graph

- (void)createAnimatedNode:(nonnull NSNumber *)tag
                    config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI16_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI16_0_0RCTValueAnimatedNode class],
            @"props" : [ABI16_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI16_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI16_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI16_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI16_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI16_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI16_0_0RCTModuloAnimatedNode class],
            @"transform" : [ABI16_0_0RCTTransformAnimatedNode class]};
  });

  NSString *nodeType = [ABI16_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI16_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI16_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  _animationNodes[tag] = node;
  [node setNeedsUpdate];
}

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag
{
  ABI16_0_0RCTAssertParam(parentTag);
  ABI16_0_0RCTAssertParam(childTag);

  ABI16_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI16_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI16_0_0RCTAssertParam(parentNode);
  ABI16_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag
{
  ABI16_0_0RCTAssertParam(parentTag);
  ABI16_0_0RCTAssertParam(childTag);

  ABI16_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI16_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI16_0_0RCTAssertParam(parentNode);
  ABI16_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag
                         viewName:(nonnull NSString *)viewName
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI16_0_0RCTPropsAnimatedNode class]]) {
    [(ABI16_0_0RCTPropsAnimatedNode *)node connectToView:viewTag viewName:viewName uiManager:_uiManager];
  }
  [node setNeedsUpdate];
}

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI16_0_0RCTPropsAnimatedNode class]]) {
    [(ABI16_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)dropAnimatedNode:(nonnull NSNumber *)tag
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
  }
}

#pragma mark -- Mutations

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ABI16_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI16_0_0RCTValueAnimatedNode *valueNode = (ABI16_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                       offset:(nonnull NSNumber *)offset
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ABI16_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI16_0_0RCTValueAnimatedNode *valueNode = (ABI16_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [valueNode setNeedsUpdate];
}

- (void)flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ABI16_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI16_0_0RCTValueAnimatedNode *valueNode = (ABI16_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

- (void)extractAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ABI16_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI16_0_0RCTValueAnimatedNode *valueNode = (ABI16_0_0RCTValueAnimatedNode *)node;
  [valueNode extractOffset];
}

#pragma mark -- Drivers

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(ABI16_0_0RCTResponseSenderBlock)callBack
{
  ABI16_0_0RCTValueAnimatedNode *valueNode = (ABI16_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI16_0_0RCTAnimationDriver>animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI16_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI16_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else {
    ABI16_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

- (void)stopAnimation:(nonnull NSNumber *)animationId
{
  for (id<ABI16_0_0RCTAnimationDriver>driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      [driver removeAnimation];
      [_activeAnimations removeObject:driver];
      break;
    }
  }
}

#pragma mark -- Events

- (void)addAnimatedEventToView:(nonnull NSNumber *)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping
{
  NSNumber *nodeTag = [ABI16_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI16_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ABI16_0_0RCTLogError(@"Animated node connected to event should be of type ABI16_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI16_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI16_0_0RCTEventAnimation *driver =
  [[ABI16_0_0RCTEventAnimation alloc] initWithEventPath:eventPath valueNode:(ABI16_0_0RCTValueAnimatedNode *)node];

  _eventDrivers[[NSString stringWithFormat:@"%@%@", viewTag, eventName]] = driver;
}

- (void)removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                          eventName:(nonnull NSString *)eventName
{
  [_eventDrivers removeObjectForKey:[NSString stringWithFormat:@"%@%@", viewTag, eventName]];
}

- (void)handleAnimatedEvent:(id<ABI16_0_0RCTEvent>)event
{
  if (_eventDrivers.count == 0) {
    return;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI16_0_0RCTEventAnimation *driver = _eventDrivers[key];
  if (driver) {
    [driver updateWithEvent:event];
    [self updateAnimations];
  }
}

#pragma mark -- Listeners

- (void)startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
                            valueObserver:(id<ABI16_0_0RCTValueAnimatedNodeObserver>)valueObserver
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ((ABI16_0_0RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}

- (void)stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
                           valueObserver:(id<ABI16_0_0RCTValueAnimatedNodeObserver>)valueObserver
{
  ABI16_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
    ((ABI16_0_0RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}


#pragma mark -- Animation Loop

- (void)startAnimationLoopIfNeeded
{
  if (!_displayLink && _activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(stepAnimations)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)stopAnimationLoopIfNeeded
{
  if (_activeAnimations.count == 0) {
    [self stopAnimationLoop];
  }
}

- (void)stopAnimationLoop
{
  if (_displayLink) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)stepAnimations
{
  for (id<ABI16_0_0RCTAnimationDriver>animationDriver in _activeAnimations) {
    [animationDriver stepAnimation];
  }

  [self updateAnimations];

  for (id<ABI16_0_0RCTAnimationDriver>animationDriver in [_activeAnimations copy]) {
    if (animationDriver.animationHasFinished) {
      [animationDriver removeAnimation];
      [_activeAnimations removeObject:animationDriver];
    }
  }

  [self stopAnimationLoopIfNeeded];
}


#pragma mark -- Updates

- (void)updateAnimations
{
  [_animationNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI16_0_0RCTAnimatedNode *node, BOOL *stop) {
    if (node.needsUpdate) {
      [node updateNodeIfNecessary];
    }
  }];
}

@end
