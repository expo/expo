#import "NativeProxy.h"
#import "DevMenuREAModule.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREATransitionManager.h"

typedef void (^AnimatedOperation)(DevMenuREANodesManager *nodesManager);

@implementation DevMenuREAModule {
  NSMutableArray<AnimatedOperation> *_operations;
  DevMenuREATransitionManager *_transitionManager;
}

+ (NSString *)moduleName { return @"ReanimatedModule"; };

- (void)invalidate
{
  _transitionManager = nil;
  [_nodesManager invalidate];
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return RCTGetUIManagerQueue();
}

#pragma mark-- Initialize

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];

}

- (void)setUpUiManager:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _nodesManager = [[DevMenuREANodesManager alloc] initWithModule:self uiManager:self.bridge.uiManager];
  _operations = [NSMutableArray new];

  _transitionManager = [[DevMenuREATransitionManager alloc] initWithUIManager:self.bridge.uiManager];

  [bridge.uiManager.observerCoordinator addObserver:self];
}

RCT_EXPORT_METHOD(installTurboModule)
{
  // TODO: Move initialization from UIResponder+DevMenuReanimated to here
}

#pragma mark-- Transitioning API

RCT_EXPORT_METHOD(animateNextTransition : (nonnull NSNumber *)rootTag config : (NSDictionary *)config)
{
  [_transitionManager animateNextTransitionInRoot:rootTag withConfig:config];
}

#pragma mark-- API

RCT_EXPORT_METHOD(createNode : (nonnull NSNumber *)nodeID config : (NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager createNode:nodeID config:config];
  }];
}

RCT_EXPORT_METHOD(dropNode : (nonnull NSNumber *)nodeID)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager dropNode:nodeID];
  }];
}

RCT_EXPORT_METHOD(getValue : (nonnull NSNumber *)nodeID callback : (RCTResponseSenderBlock)callback)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager getValue:nodeID callback:(RCTResponseSenderBlock)callback];
  }];
}

RCT_EXPORT_METHOD(connectNodes : (nonnull NSNumber *)parentID childTag : (nonnull NSNumber *)childID)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager connectNodes:parentID childID:childID];
  }];
}

RCT_EXPORT_METHOD(disconnectNodes : (nonnull NSNumber *)parentID childTag : (nonnull NSNumber *)childID)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager disconnectNodes:parentID childID:childID];
  }];
}

RCT_EXPORT_METHOD(connectNodeToView : (nonnull NSNumber *)nodeID viewTag : (nonnull NSNumber *)viewTag)
{
  NSString *viewName = [self.bridge.uiManager viewNameForReactTag:viewTag];
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager connectNodeToView:nodeID viewTag:viewTag viewName:viewName];
  }];
}

RCT_EXPORT_METHOD(disconnectNodeFromView : (nonnull NSNumber *)nodeID viewTag : (nonnull NSNumber *)viewTag)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager disconnectNodeFromView:nodeID viewTag:viewTag];
  }];
}

RCT_EXPORT_METHOD(attachEvent
                  : (nonnull NSNumber *)viewTag eventName
                  : (nonnull NSString *)eventName eventNodeID
                  : (nonnull NSNumber *)eventNodeID)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager attachEvent:viewTag eventName:eventName eventNodeID:eventNodeID];
  }];
}

RCT_EXPORT_METHOD(detachEvent
                  : (nonnull NSNumber *)viewTag eventName
                  : (nonnull NSString *)eventName eventNodeID
                  : (nonnull NSNumber *)eventNodeID)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager detachEvent:viewTag eventName:eventName eventNodeID:eventNodeID];
  }];
}

RCT_EXPORT_METHOD(setValue : (nonnull NSNumber *)nodeID newValue : (nonnull NSNumber *)newValue)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager setValueForNodeID:nodeID value:newValue];
  }];
}

RCT_EXPORT_METHOD(triggerRender)
{
  [self addOperationBlock:^(DevMenuREANodesManager *nodesManager) {
    [nodesManager postRunUpdatesAfterAnimation];
  }];
}

#pragma mark-- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(RCTUIManager *)uiManager
{
  [_nodesManager maybeFlushUpdateBuffer];
  if (_operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *operations = _operations;
  _operations = [NSMutableArray new];

  DevMenuREANodesManager *nodesManager = _nodesManager;

  [uiManager addUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(nodesManager);
    }
    [nodesManager operationsBatchDidComplete];
  }];
}

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onReanimatedCall", @"onReanimatedPropsChange" ];
}

- (void)eventDispatcherWillDispatchEvent:(id<RCTEvent>)event
{
  // Events can be dispatched from any queue
  [_nodesManager dispatchEvent:event];
}

@end
