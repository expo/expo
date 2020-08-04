/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTNativeAnimatedNodesManager.h>

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>

#import <ABI37_0_0React/ABI37_0_0RCTAdditionAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTAnimationDriver.h>
#import <ABI37_0_0React/ABI37_0_0RCTDiffClampAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTDivisionAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventAnimation.h>
#import <ABI37_0_0React/ABI37_0_0RCTFrameAnimation.h>
#import <ABI37_0_0React/ABI37_0_0RCTDecayAnimation.h>
#import <ABI37_0_0React/ABI37_0_0RCTInterpolationAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTModuloAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTMultiplicationAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTPropsAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTSpringAnimation.h>
#import <ABI37_0_0React/ABI37_0_0RCTStyleAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTSubtractionAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTTransformAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTValueAnimatedNode.h>
#import <ABI37_0_0React/ABI37_0_0RCTTrackingAnimatedNode.h>

// We do some normalizing of the event names in ABI37_0_0RCTEventDispatcher#ABI37_0_0RCTNormalizeInputEventName.
// To make things simpler just get rid of the parts we change in the event names we use here.
// This is a lot easier than trying to denormalize because there would be multiple possible
// denormalized forms for a single input.
static NSString *ABI37_0_0RCTNormalizeAnimatedEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    return [eventName substringFromIndex:2];
  }
  if ([eventName hasPrefix:@"top"]) {
    return [eventName substringFromIndex:3];
  }
  return eventName;
}

@implementation ABI37_0_0RCTNativeAnimatedNodesManager
{
  __weak ABI37_0_0RCTBridge *_bridge;
  NSMutableDictionary<NSNumber *, ABI37_0_0RCTAnimatedNode *> *_animationNodes;
  // Mapping of a view tag and an event name to a list of event animation drivers. 99% of the time
  // there will be only one driver per mapping so all code code should be optimized around that.
  NSMutableDictionary<NSString *, NSMutableArray<ABI37_0_0RCTEventAnimation *> *> *_eventDrivers;
  NSMutableSet<id<ABI37_0_0RCTAnimationDriver>> *_activeAnimations;
  CADisplayLink *_displayLink;
}

- (instancetype)initWithBridge:(nonnull ABI37_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
    _animationNodes = [NSMutableDictionary new];
    _eventDrivers = [NSMutableDictionary new];
    _activeAnimations = [NSMutableSet new];
  }
  return self;
}

- (BOOL)isNodeManagedByFabric:(nonnull NSNumber *)tag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    return [node isManagedByFabric];
  }
  return false;
}

#pragma mark -- Graph

- (void)createAnimatedNode:(nonnull NSNumber *)tag
                    config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI37_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI37_0_0RCTValueAnimatedNode class],
            @"props" : [ABI37_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI37_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI37_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI37_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI37_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI37_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI37_0_0RCTModuloAnimatedNode class],
            @"subtraction" : [ABI37_0_0RCTSubtractionAnimatedNode class],
            @"transform" : [ABI37_0_0RCTTransformAnimatedNode class],
            @"tracking" : [ABI37_0_0RCTTrackingAnimatedNode class]};
  });

  NSString *nodeType = [ABI37_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI37_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI37_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  node.manager = self;
  _animationNodes[tag] = node;
  [node setNeedsUpdate];
}

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag
{
  ABI37_0_0RCTAssertParam(parentTag);
  ABI37_0_0RCTAssertParam(childTag);

  ABI37_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI37_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI37_0_0RCTAssertParam(parentNode);
  ABI37_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag
{
  ABI37_0_0RCTAssertParam(parentTag);
  ABI37_0_0RCTAssertParam(childTag);

  ABI37_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI37_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI37_0_0RCTAssertParam(parentNode);
  ABI37_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag
                         viewName:(nonnull NSString *)viewName
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI37_0_0RCTPropsAnimatedNode class]]) {
    [(ABI37_0_0RCTPropsAnimatedNode *)node connectToView:viewTag viewName:viewName bridge:_bridge];
  }
  [node setNeedsUpdate];
}

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI37_0_0RCTPropsAnimatedNode class]]) {
    [(ABI37_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)restoreDefaultValues:(nonnull NSNumber *)nodeTag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  // Restoring default values needs to happen before UIManager operations so it is
  // possible the node hasn't been created yet if it is being connected and
  // disconnected in the same batch. In that case we don't need to restore
  // default values since it will never actually update the view.
  if (node == nil) {
    return;
  }
  if (![node isKindOfClass:[ABI37_0_0RCTPropsAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Not a props node.");
  }
  [(ABI37_0_0RCTPropsAnimatedNode *)node restoreDefaultValues];
}

- (void)dropAnimatedNode:(nonnull NSNumber *)tag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
  }
}

#pragma mark -- Mutations

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Not a value node.");
    return;
  }
  [self stopAnimationsForNode:node];

  ABI37_0_0RCTValueAnimatedNode *valueNode = (ABI37_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                       offset:(nonnull NSNumber *)offset
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI37_0_0RCTValueAnimatedNode *valueNode = (ABI37_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [valueNode setNeedsUpdate];
}

- (void)flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI37_0_0RCTValueAnimatedNode *valueNode = (ABI37_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

- (void)extractAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI37_0_0RCTValueAnimatedNode *valueNode = (ABI37_0_0RCTValueAnimatedNode *)node;
  [valueNode extractOffset];
}

#pragma mark -- Drivers

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(ABI37_0_0RCTResponseSenderBlock)callBack
{
  // check if the animation has already started
  for (id<ABI37_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      // if the animation is running, we restart it with an updated configuration
      [driver resetAnimationConfig:config];
      return;
    }
  }

  ABI37_0_0RCTValueAnimatedNode *valueNode = (ABI37_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI37_0_0RCTAnimationDriver> animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI37_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI37_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else if ([type isEqual:@"decay"]) {
    animationDriver = [[ABI37_0_0RCTDecayAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];
  } else {
    ABI37_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

- (void)stopAnimation:(nonnull NSNumber *)animationId
{
  for (id<ABI37_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      [driver stopAnimation];
      [_activeAnimations removeObject:driver];
      break;
    }
  }
}

- (void)stopAnimationsForNode:(nonnull ABI37_0_0RCTAnimatedNode *)node
{
    NSMutableArray<id<ABI37_0_0RCTAnimationDriver>> *discarded = [NSMutableArray new];
    for (id<ABI37_0_0RCTAnimationDriver> driver in _activeAnimations) {
        if ([driver.valueNode isEqual:node]) {
            [discarded addObject:driver];
        }
    }
    for (id<ABI37_0_0RCTAnimationDriver> driver in discarded) {
        [driver stopAnimation];
        [_activeAnimations removeObject:driver];
    }
}

#pragma mark -- Events

- (void)addAnimatedEventToView:(nonnull NSNumber *)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping
{
  NSNumber *nodeTag = [ABI37_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI37_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ABI37_0_0RCTLogError(@"Animated node connected to event should be of type ABI37_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI37_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI37_0_0RCTEventAnimation *driver =
    [[ABI37_0_0RCTEventAnimation alloc] initWithEventPath:eventPath valueNode:(ABI37_0_0RCTValueAnimatedNode *)node];

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI37_0_0RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    [_eventDrivers[key] addObject:driver];
  } else {
    NSMutableArray<ABI37_0_0RCTEventAnimation *> *drivers = [NSMutableArray new];
    [drivers addObject:driver];
    _eventDrivers[key] = drivers;
  }
}

- (void)removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                          eventName:(nonnull NSString *)eventName
                    animatedNodeTag:(nonnull NSNumber *)animatedNodeTag
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI37_0_0RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    if (_eventDrivers[key].count == 1) {
      [_eventDrivers removeObjectForKey:key];
    } else {
      NSMutableArray<ABI37_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
      for (NSUInteger i = 0; i < driversForKey.count; i++) {
        if (driversForKey[i].valueNode.nodeTag == animatedNodeTag) {
          [driversForKey removeObjectAtIndex:i];
          break;
        }
      }
    }
  }
}

- (void)handleAnimatedEvent:(id<ABI37_0_0RCTEvent>)event
{
  if (_eventDrivers.count == 0) {
    return;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI37_0_0RCTNormalizeAnimatedEventName(event.eventName)];
  NSMutableArray<ABI37_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
  if (driversForKey) {
    for (ABI37_0_0RCTEventAnimation *driver in driversForKey) {
      [self stopAnimationsForNode:driver.valueNode];
      [driver updateWithEvent:event];
    }

    [self updateAnimations];
  }
}

#pragma mark -- Listeners

- (void)startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
                            valueObserver:(id<ABI37_0_0RCTValueAnimatedNodeObserver>)valueObserver
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ((ABI37_0_0RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}

- (void)stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
{
  ABI37_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI37_0_0RCTValueAnimatedNode class]]) {
    ((ABI37_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
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
  for (id<ABI37_0_0RCTAnimationDriver> animationDriver in _activeAnimations) {
    [animationDriver stepAnimationWithTime:time];
  }

  [self updateAnimations];

  for (id<ABI37_0_0RCTAnimationDriver> animationDriver in [_activeAnimations copy]) {
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
  [_animationNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI37_0_0RCTAnimatedNode *node, BOOL *stop) {
    if (node.needsUpdate) {
      [node updateNodeIfNecessary];
    }
  }];
}

@end
