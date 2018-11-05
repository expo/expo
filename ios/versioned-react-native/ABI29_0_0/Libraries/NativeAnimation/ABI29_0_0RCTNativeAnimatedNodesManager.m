/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTNativeAnimatedNodesManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

#import "ABI29_0_0RCTAdditionAnimatedNode.h"
#import "ABI29_0_0RCTAnimatedNode.h"
#import "ABI29_0_0RCTAnimationDriver.h"
#import "ABI29_0_0RCTDiffClampAnimatedNode.h"
#import "ABI29_0_0RCTDivisionAnimatedNode.h"
#import "ABI29_0_0RCTEventAnimation.h"
#import "ABI29_0_0RCTFrameAnimation.h"
#import "ABI29_0_0RCTDecayAnimation.h"
#import "ABI29_0_0RCTInterpolationAnimatedNode.h"
#import "ABI29_0_0RCTModuloAnimatedNode.h"
#import "ABI29_0_0RCTMultiplicationAnimatedNode.h"
#import "ABI29_0_0RCTPropsAnimatedNode.h"
#import "ABI29_0_0RCTSpringAnimation.h"
#import "ABI29_0_0RCTStyleAnimatedNode.h"
#import "ABI29_0_0RCTTransformAnimatedNode.h"
#import "ABI29_0_0RCTValueAnimatedNode.h"
#import "ABI29_0_0RCTTrackingAnimatedNode.h"

@implementation ABI29_0_0RCTNativeAnimatedNodesManager
{
  __weak ABI29_0_0RCTUIManager *_uiManager;
  NSMutableDictionary<NSNumber *, ABI29_0_0RCTAnimatedNode *> *_animationNodes;
  // Mapping of a view tag and an event name to a list of event animation drivers. 99% of the time
  // there will be only one driver per mapping so all code code should be optimized around that.
  NSMutableDictionary<NSString *, NSMutableArray<ABI29_0_0RCTEventAnimation *> *> *_eventDrivers;
  NSMutableSet<id<ABI29_0_0RCTAnimationDriver>> *_activeAnimations;
  CADisplayLink *_displayLink;
}

- (instancetype)initWithUIManager:(nonnull ABI29_0_0RCTUIManager *)uiManager
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
    map = @{@"style" : [ABI29_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI29_0_0RCTValueAnimatedNode class],
            @"props" : [ABI29_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI29_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI29_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI29_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI29_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI29_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI29_0_0RCTModuloAnimatedNode class],
            @"transform" : [ABI29_0_0RCTTransformAnimatedNode class],
            @"tracking" : [ABI29_0_0RCTTrackingAnimatedNode class]};
  });

  NSString *nodeType = [ABI29_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI29_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI29_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  node.manager = self;
  _animationNodes[tag] = node;
  [node setNeedsUpdate];
}

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag
{
  ABI29_0_0RCTAssertParam(parentTag);
  ABI29_0_0RCTAssertParam(childTag);

  ABI29_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI29_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI29_0_0RCTAssertParam(parentNode);
  ABI29_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag
{
  ABI29_0_0RCTAssertParam(parentTag);
  ABI29_0_0RCTAssertParam(childTag);

  ABI29_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI29_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI29_0_0RCTAssertParam(parentNode);
  ABI29_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag
                         viewName:(nonnull NSString *)viewName
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI29_0_0RCTPropsAnimatedNode class]]) {
    [(ABI29_0_0RCTPropsAnimatedNode *)node connectToView:viewTag viewName:viewName uiManager:_uiManager];
  }
  [node setNeedsUpdate];
}

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI29_0_0RCTPropsAnimatedNode class]]) {
    [(ABI29_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)restoreDefaultValues:(nonnull NSNumber *)nodeTag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  // Restoring default values needs to happen before UIManager operations so it is
  // possible the node hasn't been created yet if it is being connected and
  // disconnected in the same batch. In that case we don't need to restore
  // default values since it will never actually update the view.
  if (node == nil) {
    return;
  }
  if (![node isKindOfClass:[ABI29_0_0RCTPropsAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Not a props node.");
  }
  [(ABI29_0_0RCTPropsAnimatedNode *)node restoreDefaultValues];
}

- (void)dropAnimatedNode:(nonnull NSNumber *)tag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
  }
}

#pragma mark -- Mutations

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Not a value node.");
    return;
  }
  [self stopAnimationsForNode:node];

  ABI29_0_0RCTValueAnimatedNode *valueNode = (ABI29_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                       offset:(nonnull NSNumber *)offset
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI29_0_0RCTValueAnimatedNode *valueNode = (ABI29_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [valueNode setNeedsUpdate];
}

- (void)flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI29_0_0RCTValueAnimatedNode *valueNode = (ABI29_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

- (void)extractAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI29_0_0RCTValueAnimatedNode *valueNode = (ABI29_0_0RCTValueAnimatedNode *)node;
  [valueNode extractOffset];
}

#pragma mark -- Drivers

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(ABI29_0_0RCTResponseSenderBlock)callBack
{
  // check if the animation has already started
  for (id<ABI29_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      // if the animation is running, we restart it with an updated configuration
      [driver resetAnimationConfig:config];
      return;
    }
  }

  ABI29_0_0RCTValueAnimatedNode *valueNode = (ABI29_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI29_0_0RCTAnimationDriver> animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI29_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI29_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else if ([type isEqual:@"decay"]) {
    animationDriver = [[ABI29_0_0RCTDecayAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];
  } else {
    ABI29_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

- (void)stopAnimation:(nonnull NSNumber *)animationId
{
  for (id<ABI29_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      [driver stopAnimation];
      [_activeAnimations removeObject:driver];
      break;
    }
  }
}

- (void)stopAnimationsForNode:(nonnull ABI29_0_0RCTAnimatedNode *)node
{
    NSMutableArray<id<ABI29_0_0RCTAnimationDriver>> *discarded = [NSMutableArray new];
    for (id<ABI29_0_0RCTAnimationDriver> driver in _activeAnimations) {
        if ([driver.valueNode isEqual:node]) {
            [discarded addObject:driver];
        }
    }
    for (id<ABI29_0_0RCTAnimationDriver> driver in discarded) {
        [driver stopAnimation];
        [_activeAnimations removeObject:driver];
    }
}

#pragma mark -- Events

- (void)addAnimatedEventToView:(nonnull NSNumber *)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping
{
  NSNumber *nodeTag = [ABI29_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI29_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ABI29_0_0RCTLogError(@"Animated node connected to event should be of type ABI29_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI29_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI29_0_0RCTEventAnimation *driver =
    [[ABI29_0_0RCTEventAnimation alloc] initWithEventPath:eventPath valueNode:(ABI29_0_0RCTValueAnimatedNode *)node];

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  if (_eventDrivers[key] != nil) {
    [_eventDrivers[key] addObject:driver];
  } else {
    NSMutableArray<ABI29_0_0RCTEventAnimation *> *drivers = [NSMutableArray new];
    [drivers addObject:driver];
    _eventDrivers[key] = drivers;
  }
}

- (void)removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                          eventName:(nonnull NSString *)eventName
                    animatedNodeTag:(nonnull NSNumber *)animatedNodeTag
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  if (_eventDrivers[key] != nil) {
    if (_eventDrivers[key].count == 1) {
      [_eventDrivers removeObjectForKey:key];
    } else {
      NSMutableArray<ABI29_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
      for (NSUInteger i = 0; i < driversForKey.count; i++) {
        if (driversForKey[i].valueNode.nodeTag == animatedNodeTag) {
          [driversForKey removeObjectAtIndex:i];
          break;
        }
      }
    }
  }
}

- (void)handleAnimatedEvent:(id<ABI29_0_0RCTEvent>)event
{
  if (_eventDrivers.count == 0) {
    return;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  NSMutableArray<ABI29_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
  if (driversForKey) {
    for (ABI29_0_0RCTEventAnimation *driver in driversForKey) {
      [self stopAnimationsForNode:driver.valueNode];
      [driver updateWithEvent:event];
    }

    [self updateAnimations];
  }
}

#pragma mark -- Listeners

- (void)startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
                            valueObserver:(id<ABI29_0_0RCTValueAnimatedNodeObserver>)valueObserver
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ((ABI29_0_0RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}

- (void)stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
{
  ABI29_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI29_0_0RCTValueAnimatedNode class]]) {
    ((ABI29_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}


#pragma mark -- Animation Loop

- (void)startAnimationLoopIfNeeded
{
  if (!_displayLink && _activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(stepAnimations:)];
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

- (void)stepAnimations:(CADisplayLink *)displaylink
{
  NSTimeInterval time = displaylink.timestamp;
  for (id<ABI29_0_0RCTAnimationDriver> animationDriver in _activeAnimations) {
    [animationDriver stepAnimationWithTime:time];
  }

  [self updateAnimations];

  for (id<ABI29_0_0RCTAnimationDriver> animationDriver in [_activeAnimations copy]) {
    if (animationDriver.animationHasFinished) {
      [animationDriver stopAnimation];
      [_activeAnimations removeObject:animationDriver];
    }
  }

  [self stopAnimationLoopIfNeeded];
}


#pragma mark -- Updates

- (void)updateAnimations
{
  [_animationNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI29_0_0RCTAnimatedNode *node, BOOL *stop) {
    if (node.needsUpdate) {
      [node updateNodeIfNecessary];
    }
  }];
}

@end
