#import "ABI38_0_0REAModule.h"

#import "ABI38_0_0REANodesManager.h"
#import "Transitioning/ABI38_0_0REATransitionManager.h"

typedef void (^AnimatedOperation)(ABI38_0_0REANodesManager *nodesManager);

@implementation ABI38_0_0REAModule
{
  ABI38_0_0REANodesManager *_nodesManager;
  NSMutableArray<AnimatedOperation> *_operations;
  ABI38_0_0REATransitionManager *_transitionManager;
}

ABI38_0_0RCT_EXPORT_MODULE(ReanimatedModule);

- (void)invalidate
{
  _transitionManager = nil;
  [_nodesManager invalidate];
  [self.bridge.eventDispatcher removeDispatchObserver:self];
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return ABI38_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI38_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];

  _nodesManager = [[ABI38_0_0REANodesManager alloc] initWithModule:self
                                                uiManager:self.bridge.uiManager];
  _operations = [NSMutableArray new];

  _transitionManager = [[ABI38_0_0REATransitionManager alloc] initWithUIManager:self.bridge.uiManager];

  [bridge.eventDispatcher addDispatchObserver:self];
  [bridge.uiManager.observerCoordinator addObserver:self];
}

#pragma mark -- Transitioning API

ABI38_0_0RCT_EXPORT_METHOD(animateNextTransition:(nonnull NSNumber *)rootTag config:(NSDictionary *)config)
{
  [_transitionManager animateNextTransitionInRoot:rootTag withConfig:config];
}

#pragma mark -- API

ABI38_0_0RCT_EXPORT_METHOD(createNode:(nonnull NSNumber *)nodeID
                  config:(NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager createNode:nodeID config:config];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(dropNode:(nonnull NSNumber *)nodeID)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager dropNode:nodeID];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(getValue:(nonnull NSNumber *)nodeID
                  callback:(ABI38_0_0RCTResponseSenderBlock)callback) {
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager getValue:nodeID callback:(ABI38_0_0RCTResponseSenderBlock)callback];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(connectNodes:(nonnull NSNumber *)parentID
                  childTag:(nonnull NSNumber *)childID)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager connectNodes:parentID childID:childID];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(disconnectNodes:(nonnull NSNumber *)parentID
                  childTag:(nonnull NSNumber *)childID)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager disconnectNodes:parentID childID:childID];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(connectNodeToView:(nonnull NSNumber *)nodeID
                  viewTag:(nonnull NSNumber *)viewTag)
{
  NSString *viewName = [self.bridge.uiManager viewNameForABI38_0_0ReactTag:viewTag];
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager connectNodeToView:nodeID viewTag:viewTag viewName:viewName];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(disconnectNodeFromView:(nonnull NSNumber *)nodeID
                  viewTag:(nonnull NSNumber *)viewTag)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager disconnectNodeFromView:nodeID viewTag:viewTag];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(attachEvent:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventNodeID:(nonnull NSNumber *)eventNodeID)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager attachEvent:viewTag eventName:eventName eventNodeID:eventNodeID];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(detachEvent:(nonnull NSNumber *)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventNodeID:(nonnull NSNumber *)eventNodeID)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager detachEvent:viewTag eventName:eventName eventNodeID:eventNodeID];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(configureProps:(nonnull NSArray<NSString *> *)nativeProps
                         uiProps:(nonnull NSArray<NSString *> *)uiProps)
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager configureProps:[NSSet setWithArray:nativeProps] uiProps:[NSSet setWithArray:uiProps]];
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(setValue:(nonnull NSNumber *)nodeID
                  newValue:(nonnull NSNumber *)newValue
                  )
{
  [self addOperationBlock:^(ABI38_0_0REANodesManager *nodesManager) {
    [nodesManager setValueForNodeID:nodeID value:newValue];
  }];
}

#pragma mark -- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

#pragma mark - ABI38_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI38_0_0RCTUIManager *)uiManager
{
  if (_operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *operations = _operations;
  _operations = [NSMutableArray new];

  ABI38_0_0REANodesManager *nodesManager = _nodesManager;

  [uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(nodesManager);
    }
    [nodesManager operationsBatchDidComplete];
  }];
}

#pragma mark -- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onReanimatedCall", @"onReanimatedPropsChange"];
}

- (void)eventDispatcherWillDispatchEvent:(id<ABI38_0_0RCTEvent>)event
{
  // Events can be dispatched from any queue
  [_nodesManager dispatchEvent:event];
}

@end
