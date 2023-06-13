/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTNativeAnimatedNodesManager.h>

#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>

#import <ABI47_0_0React/ABI47_0_0RCTAdditionAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTAnimationDriver.h>
#import <ABI47_0_0React/ABI47_0_0RCTColorAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTDiffClampAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTDivisionAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventAnimation.h>
#import <ABI47_0_0React/ABI47_0_0RCTFrameAnimation.h>
#import <ABI47_0_0React/ABI47_0_0RCTDecayAnimation.h>
#import <ABI47_0_0React/ABI47_0_0RCTInterpolationAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTModuloAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTMultiplicationAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTPropsAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTSpringAnimation.h>
#import <ABI47_0_0React/ABI47_0_0RCTStyleAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTSubtractionAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTTransformAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTValueAnimatedNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTTrackingAnimatedNode.h>

// We do some normalizing of the event names in ABI47_0_0RCTEventDispatcher#ABI47_0_0RCTNormalizeInputEventName.
// To make things simpler just get rid of the parts we change in the event names we use here.
// This is a lot easier than trying to denormalize because there would be multiple possible
// denormalized forms for a single input.
static NSString *ABI47_0_0RCTNormalizeAnimatedEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    return [eventName substringFromIndex:2];
  }
  if ([eventName hasPrefix:@"top"]) {
    return [eventName substringFromIndex:3];
  }
  return eventName;
}

@implementation ABI47_0_0RCTNativeAnimatedNodesManager
{
  __weak ABI47_0_0RCTBridge *_bridge;
  __weak id<ABI47_0_0RCTSurfacePresenterStub> _surfacePresenter;
  NSMutableDictionary<NSNumber *, ABI47_0_0RCTAnimatedNode *> *_animationNodes;
  // Mapping of a view tag and an event name to a list of event animation drivers. 99% of the time
  // there will be only one driver per mapping so all code code should be optimized around that.
  NSMutableDictionary<NSString *, NSMutableArray<ABI47_0_0RCTEventAnimation *> *> *_eventDrivers;
  NSMutableSet<id<ABI47_0_0RCTAnimationDriver>> *_activeAnimations;
  CADisplayLink *_displayLink;
}

- (instancetype)initWithBridge:(nullable ABI47_0_0RCTBridge *)bridge surfacePresenter:(id<ABI47_0_0RCTSurfacePresenterStub>)surfacePresenter;
{
  if ((self = [super init])) {
    _bridge = bridge;
    _surfacePresenter = surfacePresenter;
    _animationNodes = [NSMutableDictionary new];
    _eventDrivers = [NSMutableDictionary new];
    _activeAnimations = [NSMutableSet new];
  }
  return self;
}

- (BOOL)isNodeManagedByFabric:(NSNumber *)tag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    return [node isManagedByFabric];
  }
  return false;
}

#pragma mark -- Graph

- (void)createAnimatedNode:(NSNumber *)tag
                    config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"style" : [ABI47_0_0RCTStyleAnimatedNode class],
            @"value" : [ABI47_0_0RCTValueAnimatedNode class],
            @"color" : [ABI47_0_0RCTColorAnimatedNode class],
            @"props" : [ABI47_0_0RCTPropsAnimatedNode class],
            @"interpolation" : [ABI47_0_0RCTInterpolationAnimatedNode class],
            @"addition" : [ABI47_0_0RCTAdditionAnimatedNode class],
            @"diffclamp": [ABI47_0_0RCTDiffClampAnimatedNode class],
            @"division" : [ABI47_0_0RCTDivisionAnimatedNode class],
            @"multiplication" : [ABI47_0_0RCTMultiplicationAnimatedNode class],
            @"modulus" : [ABI47_0_0RCTModuloAnimatedNode class],
            @"subtraction" : [ABI47_0_0RCTSubtractionAnimatedNode class],
            @"transform" : [ABI47_0_0RCTTransformAnimatedNode class],
            @"tracking" : [ABI47_0_0RCTTrackingAnimatedNode class]};
  });

  NSString *nodeType = [ABI47_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI47_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI47_0_0RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  node.manager = self;
  _animationNodes[tag] = node;
  [node setNeedsUpdate];
}

- (void)connectAnimatedNodes:(NSNumber *)parentTag
                    childTag:(NSNumber *)childTag
{
  ABI47_0_0RCTAssertParam(parentTag);
  ABI47_0_0RCTAssertParam(childTag);

  ABI47_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI47_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI47_0_0RCTAssertParam(parentNode);
  ABI47_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)disconnectAnimatedNodes:(NSNumber *)parentTag
                       childTag:(NSNumber *)childTag
{
  ABI47_0_0RCTAssertParam(parentTag);
  ABI47_0_0RCTAssertParam(childTag);

  ABI47_0_0RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  ABI47_0_0RCTAnimatedNode *childNode = _animationNodes[childTag];

  ABI47_0_0RCTAssertParam(parentNode);
  ABI47_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(NSNumber *)nodeTag
                          viewTag:(NSNumber *)viewTag
                         viewName:(nullable NSString *)viewName
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI47_0_0RCTPropsAnimatedNode class]]) {
    // viewName is not used when node is managed by Fabric
    [(ABI47_0_0RCTPropsAnimatedNode *)node connectToView:viewTag
                                       viewName:viewName
                                         bridge:_bridge
                               surfacePresenter:_surfacePresenter];
  }
  [node setNeedsUpdate];
}

- (void)disconnectAnimatedNodeFromView:(NSNumber *)nodeTag
                               viewTag:(NSNumber *)viewTag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[ABI47_0_0RCTPropsAnimatedNode class]]) {
    [(ABI47_0_0RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)restoreDefaultValues:(NSNumber *)nodeTag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  // Restoring default values needs to happen before UIManager operations so it is
  // possible the node hasn't been created yet if it is being connected and
  // disconnected in the same batch. In that case we don't need to restore
  // default values since it will never actually update the view.
  if (node == nil) {
    return;
  }
  if (![node isKindOfClass:[ABI47_0_0RCTPropsAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Not a props node.");
  }
  [(ABI47_0_0RCTPropsAnimatedNode *)node restoreDefaultValues];
}

- (void)dropAnimatedNode:(NSNumber *)tag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if (node) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
  }
}

#pragma mark -- Mutations

- (void)setAnimatedNodeValue:(NSNumber *)nodeTag
                       value:(NSNumber *)value
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Not a value node.");
    return;
  }
  [self stopAnimationsForNode:node];

  ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)setAnimatedNodeOffset:(NSNumber *)nodeTag
                       offset:(NSNumber *)offset
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [valueNode setNeedsUpdate];
}

- (void)flattenAnimatedNodeOffset:(NSNumber *)nodeTag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

- (void)extractAnimatedNodeOffset:(NSNumber *)nodeTag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Not a value node.");
    return;
  }

  ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)node;
  [valueNode extractOffset];
}

- (void)getValue:(NSNumber *)nodeTag saveCallback:(ABI47_0_0RCTResponseSenderBlock)saveCallback
{
     ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];
     if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
       ABI47_0_0RCTLogError(@"Not a value node.");
       return;
     }
    ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)node;;
    saveCallback(@[@(valueNode.value)]);
}

- (void)updateAnimatedNodeConfig:(NSNumber *)tag
                    config:(NSDictionary<NSString *, id> *)config
{
  // TODO (T111179606): Support platform colors for color animations
}

#pragma mark -- Drivers

- (void)startAnimatingNode:(NSNumber *)animationId
                   nodeTag:(NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(nullable ABI47_0_0RCTResponseSenderBlock)callBack
{
  // check if the animation has already started
  for (id<ABI47_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      // if the animation is running, we restart it with an updated configuration
      [driver resetAnimationConfig:config];
      return;
    }
  }

  ABI47_0_0RCTValueAnimatedNode *valueNode = (ABI47_0_0RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<ABI47_0_0RCTAnimationDriver> animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[ABI47_0_0RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[ABI47_0_0RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else if ([type isEqual:@"decay"]) {
    animationDriver = [[ABI47_0_0RCTDecayAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];
  } else {
    ABI47_0_0RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

- (void)stopAnimation:(NSNumber *)animationId
{
  for (id<ABI47_0_0RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      [driver stopAnimation];
      [_activeAnimations removeObject:driver];
      break;
    }
  }
}

- (void)stopAnimationsForNode:(ABI47_0_0RCTAnimatedNode *)node
{
    NSMutableArray<id<ABI47_0_0RCTAnimationDriver>> *discarded = [NSMutableArray new];
    for (id<ABI47_0_0RCTAnimationDriver> driver in _activeAnimations) {
        if ([driver.valueNode isEqual:node]) {
            [discarded addObject:driver];
        }
    }
    for (id<ABI47_0_0RCTAnimationDriver> driver in discarded) {
        [driver stopAnimation];
        [_activeAnimations removeObject:driver];
    }
}

#pragma mark -- Events

- (void)addAnimatedEventToView:(NSNumber *)viewTag
                     eventName:(NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping
{
  NSNumber *nodeTag = [ABI47_0_0RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (!node) {
    ABI47_0_0RCTLogError(@"Animated node with tag %@ does not exists", nodeTag);
    return;
  }

  if (![node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ABI47_0_0RCTLogError(@"Animated node connected to event should be of type ABI47_0_0RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [ABI47_0_0RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  ABI47_0_0RCTEventAnimation *driver =
    [[ABI47_0_0RCTEventAnimation alloc] initWithEventPath:eventPath valueNode:(ABI47_0_0RCTValueAnimatedNode *)node];

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI47_0_0RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    [_eventDrivers[key] addObject:driver];
  } else {
    NSMutableArray<ABI47_0_0RCTEventAnimation *> *drivers = [NSMutableArray new];
    [drivers addObject:driver];
    _eventDrivers[key] = drivers;
  }
}

- (void)removeAnimatedEventFromView:(NSNumber *)viewTag
                          eventName:(NSString *)eventName
                    animatedNodeTag:(NSNumber *)animatedNodeTag
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI47_0_0RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    if (_eventDrivers[key].count == 1) {
      [_eventDrivers removeObjectForKey:key];
    } else {
      NSMutableArray<ABI47_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
      for (NSUInteger i = 0; i < driversForKey.count; i++) {
        if (driversForKey[i].valueNode.nodeTag == animatedNodeTag) {
          [driversForKey removeObjectAtIndex:i];
          break;
        }
      }
    }
  }
}

- (void)handleAnimatedEvent:(id<ABI47_0_0RCTEvent>)event
{
  if (_eventDrivers.count == 0) {
    return;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI47_0_0RCTNormalizeAnimatedEventName(event.eventName)];
  NSMutableArray<ABI47_0_0RCTEventAnimation *> *driversForKey = _eventDrivers[key];
  if (driversForKey) {
    for (ABI47_0_0RCTEventAnimation *driver in driversForKey) {
      [self stopAnimationsForNode:driver.valueNode];
      [driver updateWithEvent:event];
    }

    [self updateAnimations];
  }
}

#pragma mark -- Listeners

- (void)startListeningToAnimatedNodeValue:(NSNumber *)tag
                            valueObserver:(id<ABI47_0_0RCTValueAnimatedNodeObserver>)valueObserver
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ((ABI47_0_0RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}

- (void)stopListeningToAnimatedNodeValue:(NSNumber *)tag
{
  ABI47_0_0RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[ABI47_0_0RCTValueAnimatedNode class]]) {
    ((ABI47_0_0RCTValueAnimatedNode *)node).valueObserver = nil;
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
  for (id<ABI47_0_0RCTAnimationDriver> animationDriver in _activeAnimations) {
    [animationDriver stepAnimationWithTime:time];
  }

  [self updateAnimations];

  for (id<ABI47_0_0RCTAnimationDriver> animationDriver in [_activeAnimations copy]) {
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
  [_animationNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI47_0_0RCTAnimatedNode *node, BOOL *stop) {
    if (node.needsUpdate) {
      [node updateNodeIfNecessary];
    }
  }];
}

@end
