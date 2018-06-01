#import "ABI28_0_0REANodesManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>

#import "Nodes/ABI28_0_0REANode.h"
#import "Nodes/ABI28_0_0REAPropsNode.h"
#import "Nodes/ABI28_0_0REAStyleNode.h"
#import "Nodes/ABI28_0_0REATransformNode.h"
#import "Nodes/ABI28_0_0REAValueNode.h"
#import "Nodes/ABI28_0_0REABlockNode.h"
#import "Nodes/ABI28_0_0REACondNode.h"
#import "Nodes/ABI28_0_0REAOperatorNode.h"
#import "Nodes/ABI28_0_0REASetNode.h"
#import "Nodes/ABI28_0_0READebugNode.h"
#import "Nodes/ABI28_0_0REAClockNodes.h"
#import "Nodes/ABI28_0_0REAJSCallNode.h"
#import "Nodes/ABI28_0_0REABezierNode.h"
#import "Nodes/ABI28_0_0REAEventNode.h"

@implementation ABI28_0_0REANodesManager
{
  NSMutableDictionary<ABI28_0_0REANodeID, ABI28_0_0REANode *> *_nodes;
  NSMapTable<NSString *, ABI28_0_0REANode *> *_eventMapping;
  NSMutableArray<id<ABI28_0_0RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  ABI28_0_0REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  NSMutableArray<ABI28_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
}

- (instancetype)initWithModule:(ABI28_0_0REAModule *)reanimatedModule
                     uiManager:(ABI28_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [ABI28_0_0REAUpdateContext new];
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
  }
  return self;
}

- (void)invalidate
{
  [self stopUpdatingOnAnimationFrame];
}

- (ABI28_0_0REANode *)findNodeByID:(ABI28_0_0REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(ABI28_0_0REAOnAnimationCallback)clb
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
  _currentAnimationTimestamp = displayLink.timestamp;

  // We process all enqueued events first
  for (NSUInteger i = 0; i < _eventQueue.count; i++) {
    id<ABI28_0_0RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<ABI28_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI28_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [ABI28_0_0REANode runPropUpdates:_updateContext];
  _wantRunUpdates = NO;

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

#pragma mark -- Graph

- (void)createNode:(ABI28_0_0REANodeID)nodeID
            config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"props": [ABI28_0_0REAPropsNode class],
            @"style": [ABI28_0_0REAStyleNode class],
            @"transform": [ABI28_0_0REATransformNode class],
            @"value": [ABI28_0_0REAValueNode class],
            @"block": [ABI28_0_0REABlockNode class],
            @"cond": [ABI28_0_0REACondNode class],
            @"op": [ABI28_0_0REAOperatorNode class],
            @"set": [ABI28_0_0REASetNode class],
            @"debug": [ABI28_0_0READebugNode class],
            @"clock": [ABI28_0_0REAClockNode class],
            @"clockStart": [ABI28_0_0REAClockStartNode class],
            @"clockStop": [ABI28_0_0REAClockStopNode class],
            @"clockTest": [ABI28_0_0REAClockTestNode class],
            @"call": [ABI28_0_0REAJSCallNode class],
            @"bezier": [ABI28_0_0REABezierNode class],
            @"event": [ABI28_0_0REAEventNode class],
//            @"listener": nil,
            };
  });

  NSString *nodeType = [ABI28_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI28_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI28_0_0REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(ABI28_0_0REANodeID)nodeID
{
  ABI28_0_0REANode *node = _nodes[nodeID];
  if (node) {
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull ABI28_0_0REANodeID)childID
{
  ABI28_0_0RCTAssertParam(parentID);
  ABI28_0_0RCTAssertParam(childID);

  ABI28_0_0REANode *parentNode = _nodes[parentID];
  ABI28_0_0REANode *childNode = _nodes[childID];

  ABI28_0_0RCTAssertParam(parentNode);
  ABI28_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(ABI28_0_0REANodeID)parentID childID:(ABI28_0_0REANodeID)childID
{
  ABI28_0_0RCTAssertParam(parentID);
  ABI28_0_0RCTAssertParam(childID);

  ABI28_0_0REANode *parentNode = _nodes[parentID];
  ABI28_0_0REANode *childNode = _nodes[childID];

  ABI28_0_0RCTAssertParam(parentNode);
  ABI28_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(ABI28_0_0REANodeID)nodeID
                  viewTag:(NSNumber *)viewTag
                 viewName:(NSString *)viewName
{
  ABI28_0_0RCTAssertParam(nodeID);
  ABI28_0_0REANode *node = _nodes[nodeID];
  ABI28_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI28_0_0REAPropsNode class]]) {
    [(ABI28_0_0REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(ABI28_0_0REANodeID)nodeID
                       viewTag:(NSNumber *)viewTag
{
  ABI28_0_0RCTAssertParam(nodeID);
  ABI28_0_0REANode *node = _nodes[nodeID];
  ABI28_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI28_0_0REAPropsNode class]]) {
    [(ABI28_0_0REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI28_0_0REANodeID)eventNodeID
{
  ABI28_0_0RCTAssertParam(eventNodeID);
  ABI28_0_0REANode *eventNode = _nodes[eventNodeID];
  ABI28_0_0RCTAssert([eventNode isKindOfClass:[ABI28_0_0REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  ABI28_0_0RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI28_0_0REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<ABI28_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI28_0_0REAEventNode *eventNode = [_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)dispatchEvent:(id<ABI28_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI28_0_0REANode *eventNode = [_eventMapping objectForKey:key];

  if (eventNode != nil) {
    // enqueue node to be processed
    [_eventQueue addObject:event];
    [self startUpdatingOnAnimationFrame];
  }
}

- (void)configureNativeProps:(NSSet<NSString *> *)nativeProps
{
  _nativeProps = nativeProps;
}

@end
