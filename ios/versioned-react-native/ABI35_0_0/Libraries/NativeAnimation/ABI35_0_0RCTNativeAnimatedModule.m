/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI35_0_0RCTNativeAnimatedModule.h"

#import "ABI35_0_0RCTNativeAnimatedNodesManager.h"

typedef void (^AnimatedOperation)(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager);

@implementation ABI35_0_0RCTNativeAnimatedModule
{
  ABI35_0_0RCTNativeAnimatedNodesManager *_nodesManager;

  // Oparations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;
}

ABI35_0_0RCT_EXPORT_MODULE();

- (void)invalidate
{
  [_nodesManager stopAnimationLoop];
  [self.bridge.eventDispatcher removeDispatchObserver:self];
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return ABI35_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI35_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _nodesManager = [[ABI35_0_0RCTNativeAnimatedNodesManager alloc] initWithUIManager:self.bridge.uiManager];
  _operations = [NSMutableArray new];
  _preOperations = [NSMutableArray new];

  [bridge.eventDispatcher addDispatchObserver:self];
  [bridge.uiManager.observerCoordinator addObserver:self];
}

#pragma mark -- API

ABI35_0_0RCT_EXPORT_METHOD(createAnimatedNode:(nonnull NSNumber *)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:tag config:config];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:parentTag childTag:childTag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                  childTag:(nonnull NSNumber *)childTag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:parentTag childTag:childTag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(startAnimatingNode:(nonnull NSNumber *)animationId
                  nodeTag:(nonnull NSNumber *)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI35_0_0RCTResponseSenderBlock)callBack)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:animationId nodeTag:nodeTag config:config endCallback:callBack];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(stopAnimation:(nonnull NSNumber *)animationId)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:animationId];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                  value:(nonnull NSNumber *)value)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:nodeTag value:value];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                  offset:(nonnull NSNumber *)offset)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:nodeTag offset:offset];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:nodeTag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(extractAnimatedNodeOffset:(nonnull NSNumber *)nodeTag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:nodeTag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  NSString *viewName = [self.bridge.uiManager viewNameForReactABI35_0_0Tag:viewTag];
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodeToView:nodeTag viewTag:viewTag viewName:viewName];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [self addPreOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:nodeTag];
  }];
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:nodeTag viewTag:viewTag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(nonnull NSNumber *)tag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:tag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  __weak id<ABI35_0_0RCTValueAnimatedNodeObserver> valueObserver = self;
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:tag valueObserver:valueObserver];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:tag];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(addAnimatedEventToView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:viewTag eventName:eventName eventMapping:eventMapping];
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
            animatedNodeTag:(nonnull NSNumber *)animatedNodeTag)
{
  [self addOperationBlock:^(ABI35_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:viewTag eventName:eventName animatedNodeTag:animatedNodeTag];
  }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

- (void)addPreOperationBlock:(AnimatedOperation)operation
{
  [_preOperations addObject:operation];
}

#pragma mark - ABI35_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI35_0_0RCTUIManager *)uiManager
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  [uiManager prependUIBlock:^(__unused ABI35_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in preOperations) {
      operation(self->_nodesManager);
    }
  }];

  [uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }

    [self->_nodesManager updateAnimations];
  }];
}

#pragma mark -- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAnimatedValueUpdate"];
}

- (void)animatedNode:(ABI35_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}

- (void)eventDispatcherWillDispatchEvent:(id<ABI35_0_0RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  ABI35_0_0RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];
  });
}

@end
