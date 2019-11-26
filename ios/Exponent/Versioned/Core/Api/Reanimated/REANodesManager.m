#import "REANodesManager.h"

#import <React/RCTConvert.h>

#import "Nodes/REANode.h"
#import "Nodes/REAPropsNode.h"
#import "Nodes/REAStyleNode.h"
#import "Nodes/REATransformNode.h"
#import "Nodes/REAValueNode.h"
#import "Nodes/REABlockNode.h"
#import "Nodes/REACondNode.h"
#import "Nodes/REAOperatorNode.h"
#import "Nodes/REASetNode.h"
#import "Nodes/READebugNode.h"
#import "Nodes/REAClockNodes.h"
#import "Nodes/REAJSCallNode.h"
#import "Nodes/REABezierNode.h"
#import "Nodes/REAEventNode.h"
#import "REAModule.h"
#import "Nodes/REAAlwaysNode.h"
#import "Nodes/REAConcatNode.h"
#import "Nodes/REAParamNode.h"
#import "Nodes/REAFunctionNode.h"
#import "Nodes/REACallFuncNode.h"

@interface RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)reactTag
          viewName:(NSString *)viewName
             props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end


// Interface below has been added in order to use private methods of RCTUIManager,
// RCTUIManager#UpdateView is a React Method which is exported to JS but in 
// Objective-C it stays private
// RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)reactTag
          viewName:(NSString *)viewName
             props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end


@implementation REANodesManager
{
  NSMutableDictionary<REANodeID, REANode *> *_nodes;
  NSMapTable<NSString *, REANode *> *_eventMapping;
  NSMutableArray<id<RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  BOOL _processingDirectEvent;
  NSMutableArray<REAOnAnimationCallback> *_onAnimationCallbacks;
  NSMutableArray<REANativeAnimationOp> *_operationsInBatch;
}

- (instancetype)initWithModule:(REAModule *)reanimatedModule
                     uiManager:(RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [REAUpdateContext new];
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

- (REANode *)findNodeByID:(REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(REAOnAnimationCallback)clb
{
  [_onAnimationCallbacks addObject:clb];
  [self startUpdatingOnAnimationFrame];
}

- (void)postRunUpdatesAfterAnimation
{
  _wantRunUpdates = YES;
  if (!_processingDirectEvent) {
    [self startUpdatingOnAnimationFrame];
  }
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
    id<RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (REAOnAnimationCallback block in callbacks) {
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
    [REANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];
    RCTExecuteOnUIManagerQueue(^{
      for (int i = 0; i < copiedOperationsQueue.count; i++) {
        copiedOperationsQueue[i](self.uiManager);
      }
      [self.uiManager setNeedsLayout];
    });
  }
  _wantRunUpdates = NO;
}

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps {
  [_operationsInBatch addObject:^(RCTUIManager *uiManager) {
    [uiManager updateView:reactTag viewName:viewName props:nativeProps];
  }];
}

- (void)getValue:(REANodeID)nodeID
        callback:(RCTResponseSenderBlock)callback
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

- (void)createNode:(REANodeID)nodeID
            config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"props": [REAPropsNode class],
            @"style": [REAStyleNode class],
            @"transform": [REATransformNode class],
            @"value": [REAValueNode class],
            @"block": [REABlockNode class],
            @"cond": [REACondNode class],
            @"op": [REAOperatorNode class],
            @"set": [REASetNode class],
            @"debug": [READebugNode class],
            @"clock": [REAClockNode class],
            @"clockStart": [REAClockStartNode class],
            @"clockStop": [REAClockStopNode class],
            @"clockTest": [REAClockTestNode class],
            @"call": [REAJSCallNode class],
            @"bezier": [REABezierNode class],
            @"event": [REAEventNode class],
            @"always": [REAAlwaysNode class],
            @"concat": [REAConcatNode class],
            @"param": [REAParamNode class],
            @"func": [REAFunctionNode class],
            @"callfunc": [REACallFuncNode class],
//            @"listener": nil,
            };
  });

  NSString *nodeType = [RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(REANodeID)nodeID
{
  REANode *node = _nodes[nodeID];
  if (node) {
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull REANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  REANode *parentNode = _nodes[parentID];
  REANode *childNode = _nodes[childID];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(REANodeID)parentID childID:(REANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  REANode *parentNode = _nodes[parentID];
  REANode *childNode = _nodes[childID];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(REANodeID)nodeID
                  viewTag:(NSNumber *)viewTag
                 viewName:(NSString *)viewName
{
  RCTAssertParam(nodeID);
  REANode *node = _nodes[nodeID];
  RCTAssertParam(node);

  if ([node isKindOfClass:[REAPropsNode class]]) {
    [(REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(REANodeID)nodeID
                       viewTag:(NSNumber *)viewTag
{
  RCTAssertParam(nodeID);
  REANode *node = _nodes[nodeID];
  RCTAssertParam(node);

  if ([node isKindOfClass:[REAPropsNode class]]) {
    [(REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(REANodeID)eventNodeID
{
  RCTAssertParam(eventNodeID);
  REANode *eventNode = _nodes[eventNodeID];
  RCTAssert([eventNode isKindOfClass:[REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  REAEventNode *eventNode = [_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)processDirectEvent:(id<RCTEvent>)event
{
  _processingDirectEvent = YES;
  [self processEvent:event];
  [self performOperations];
  _processingDirectEvent = NO;
}

- (BOOL)isDirectEvent:(id<RCTEvent>)event
{
  static NSArray<NSString *> *directEventNames;
  static dispatch_once_t directEventNamesToken;
  dispatch_once(&directEventNamesToken, ^{
    directEventNames = @[
      @"onContentSizeChange",
      @"onMomentumScrollBegin",
      @"onMomentumScrollEnd",
      @"onScroll",
      @"onScrollBeginDrag",
      @"onScrollEndDrag"
    ];
  });
  
  return [directEventNames containsObject:event.eventName];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  REANode *eventNode = [_eventMapping objectForKey:key];

  if (eventNode != nil) {
    if ([self isDirectEvent:event]) {
      // Bypass the event queue/animation frames and process scroll events
      // immediately to avoid getting out of sync with the scroll position
      [self processDirectEvent:event];
    } else {
      // enqueue node to be processed
      [_eventQueue addObject:event];
      [self startUpdatingOnAnimationFrame];
    }
  }
}

- (void)configureProps:(NSSet<NSString *> *)nativeProps
               uiProps:(NSSet<NSString *> *)uiProps
{
  _uiProps = uiProps;
  _nativeProps = nativeProps;
}

@end
