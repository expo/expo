#import "ABI34_0_0REANodesManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>

#import "Nodes/ABI34_0_0REANode.h"
#import "Nodes/ABI34_0_0REAPropsNode.h"
#import "Nodes/ABI34_0_0REAStyleNode.h"
#import "Nodes/ABI34_0_0REATransformNode.h"
#import "Nodes/ABI34_0_0REAValueNode.h"
#import "Nodes/ABI34_0_0REABlockNode.h"
#import "Nodes/ABI34_0_0REACondNode.h"
#import "Nodes/ABI34_0_0REAOperatorNode.h"
#import "Nodes/ABI34_0_0REASetNode.h"
#import "Nodes/ABI34_0_0READebugNode.h"
#import "Nodes/ABI34_0_0REAClockNodes.h"
#import "Nodes/ABI34_0_0REAJSCallNode.h"
#import "Nodes/ABI34_0_0REABezierNode.h"
#import "Nodes/ABI34_0_0REAEventNode.h"
#import "ABI34_0_0REAModule.h"
#import "Nodes/ABI34_0_0REAAlwaysNode.h"
#import "Nodes/ABI34_0_0REAConcatNode.h"
#import "ABI34_0_0REAModule.h"

@interface ABI34_0_0RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)ReactABI34_0_0Tag
          viewName:(NSString *)viewName
             props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end


// Interface below has been added in order to use private methods of ABI34_0_0RCTUIManager,
// ABI34_0_0RCTUIManager#UpdateView is a ReactABI34_0_0 Method which is exported to JS but in 
// Objective-C it stays private
// ABI34_0_0RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface ABI34_0_0RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)ReactABI34_0_0Tag
          viewName:(NSString *)viewName
             props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end


@implementation ABI34_0_0REANodesManager
{
  NSMutableDictionary<ABI34_0_0REANodeID, ABI34_0_0REANode *> *_nodes;
  NSMapTable<NSString *, ABI34_0_0REANode *> *_eventMapping;
  NSMutableArray<id<ABI34_0_0RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  ABI34_0_0REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  NSMutableArray<ABI34_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
  NSMutableArray<ABI34_0_0REANativeAnimationOp> *_operationsInBatch;
}

- (instancetype)initWithModule:(ABI34_0_0REAModule *)reanimatedModule
                     uiManager:(ABI34_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [ABI34_0_0REAUpdateContext new];
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
    _operationsInBatch = [NSMutableArray new];
  }
  return self;
}

- (void)invalidate
{
  [self stopUpdatingOnAnimationFrame];
}

- (void)operationsBatchDidComplete
{
  if (_displayLink) {
    // if display link is set it means some of the operations that have run as a part of the batch
    // requested updates. We want updates to be run in the same frame as in which operations have
    // been scheduled as it may mean the new view has just been mounted and expects its initial
    // props to be calculated.
    // Unfortunately if the operation has just scheduled animation callback it won't run until the
    // next frame, so it's being triggered manually.
    _wantRunUpdates = YES;
    [self performOperations];
  }
}

- (ABI34_0_0REANode *)findNodeByID:(ABI34_0_0REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(ABI34_0_0REAOnAnimationCallback)clb
{
  [_onAnimationCallbacks addObject:clb];
  [self startUpdatingOnAnimationFrame];
}

- (void)postRunUpdatesAfterAnimation
{
  _wantRunUpdates = YES;
  [self startUpdatingOnAnimationFrame];
}

- (void)startUpdatingOnAnimationFrame
{
  if (!_displayLink) {
    // Setting _currentAnimationTimestamp here is connected with manual triggering of performOperations
    // in operationsBatchDidComplete. If new node has been created and clock has not been started,
    // _displayLink won't be initialized soon enough and _displayLink.timestamp will be 0.
    // However, CADisplayLink is using CACurrentMediaTime so if there's need to perform one more
    // evaluation, it could be used it here. In usual case, CACurrentMediaTime is not being used in
    // favor of setting it with _displayLink.timestamp in onAnimationFrame method.
    _currentAnimationTimestamp = CACurrentMediaTime();
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onAnimationFrame:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)stopUpdatingOnAnimationFrame
{
  if (_displayLink) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)onAnimationFrame:(CADisplayLink *)displayLink
{
  // We process all enqueued events first
  _currentAnimationTimestamp = _displayLink.timestamp;
  for (NSUInteger i = 0; i < _eventQueue.count; i++) {
    id<ABI34_0_0RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<ABI34_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI34_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (void)performOperations
{
  if (_wantRunUpdates) {
    [ABI34_0_0REANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<ABI34_0_0REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];
    ABI34_0_0RCTExecuteOnUIManagerQueue(^{
      for (int i = 0; i < copiedOperationsQueue.count; i++) {
        copiedOperationsQueue[i](self.uiManager);
      }
      [self.uiManager setNeedsLayout];
    });
  }
  _wantRunUpdates = NO;
}

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ReactABI34_0_0Tag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps {
  [_operationsInBatch addObject:^(ABI34_0_0RCTUIManager *uiManager) {
    [uiManager updateView:ReactABI34_0_0Tag viewName:viewName props:nativeProps];
  }];
}

- (void)getValue:(ABI34_0_0REANodeID)nodeID
        callback:(ABI34_0_0RCTResponseSenderBlock)callback
{
  id val = _nodes[nodeID].value;
  if (val) {
    callback(@[val]);
  } else {
    // NULL is not an object and it's not possible to pass it as callback's argument
    callback(@[[NSNull null]]);
  }
}

#pragma mark -- Graph

- (void)createNode:(ABI34_0_0REANodeID)nodeID
            config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"props": [ABI34_0_0REAPropsNode class],
            @"style": [ABI34_0_0REAStyleNode class],
            @"transform": [ABI34_0_0REATransformNode class],
            @"value": [ABI34_0_0REAValueNode class],
            @"block": [ABI34_0_0REABlockNode class],
            @"cond": [ABI34_0_0REACondNode class],
            @"op": [ABI34_0_0REAOperatorNode class],
            @"set": [ABI34_0_0REASetNode class],
            @"debug": [ABI34_0_0READebugNode class],
            @"clock": [ABI34_0_0REAClockNode class],
            @"clockStart": [ABI34_0_0REAClockStartNode class],
            @"clockStop": [ABI34_0_0REAClockStopNode class],
            @"clockTest": [ABI34_0_0REAClockTestNode class],
            @"call": [ABI34_0_0REAJSCallNode class],
            @"bezier": [ABI34_0_0REABezierNode class],
            @"event": [ABI34_0_0REAEventNode class],
            @"always": [ABI34_0_0REAAlwaysNode class],
            @"concat": [ABI34_0_0REAConcatNode class],
//            @"listener": nil,
            };
  });

  NSString *nodeType = [ABI34_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI34_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI34_0_0REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(ABI34_0_0REANodeID)nodeID
{
  ABI34_0_0REANode *node = _nodes[nodeID];
  if (node) {
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull ABI34_0_0REANodeID)childID
{
  ABI34_0_0RCTAssertParam(parentID);
  ABI34_0_0RCTAssertParam(childID);

  ABI34_0_0REANode *parentNode = _nodes[parentID];
  ABI34_0_0REANode *childNode = _nodes[childID];

  ABI34_0_0RCTAssertParam(parentNode);
  ABI34_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(ABI34_0_0REANodeID)parentID childID:(ABI34_0_0REANodeID)childID
{
  ABI34_0_0RCTAssertParam(parentID);
  ABI34_0_0RCTAssertParam(childID);

  ABI34_0_0REANode *parentNode = _nodes[parentID];
  ABI34_0_0REANode *childNode = _nodes[childID];

  ABI34_0_0RCTAssertParam(parentNode);
  ABI34_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(ABI34_0_0REANodeID)nodeID
                  viewTag:(NSNumber *)viewTag
                 viewName:(NSString *)viewName
{
  ABI34_0_0RCTAssertParam(nodeID);
  ABI34_0_0REANode *node = _nodes[nodeID];
  ABI34_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI34_0_0REAPropsNode class]]) {
    [(ABI34_0_0REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(ABI34_0_0REANodeID)nodeID
                       viewTag:(NSNumber *)viewTag
{
  ABI34_0_0RCTAssertParam(nodeID);
  ABI34_0_0REANode *node = _nodes[nodeID];
  ABI34_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI34_0_0REAPropsNode class]]) {
    [(ABI34_0_0REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI34_0_0REANodeID)eventNodeID
{
  ABI34_0_0RCTAssertParam(eventNodeID);
  ABI34_0_0REANode *eventNode = _nodes[eventNodeID];
  ABI34_0_0RCTAssert([eventNode isKindOfClass:[ABI34_0_0REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  ABI34_0_0RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI34_0_0REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<ABI34_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI34_0_0REAEventNode *eventNode = [_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)dispatchEvent:(id<ABI34_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI34_0_0REANode *eventNode = [_eventMapping objectForKey:key];

  if (eventNode != nil) {
    // enqueue node to be processed
    [_eventQueue addObject:event];
    [self startUpdatingOnAnimationFrame];
  }
}

- (void)configureProps:(NSSet<NSString *> *)nativeProps
               uiProps:(NSSet<NSString *> *)uiProps
{
  _uiProps = uiProps;
  _nativeProps = nativeProps;
}

@end
