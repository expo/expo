#import "ABI29_0_0REANodesManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

#import "Nodes/ABI29_0_0REANode.h"
#import "Nodes/ABI29_0_0REAPropsNode.h"
#import "Nodes/ABI29_0_0REAStyleNode.h"
#import "Nodes/ABI29_0_0REATransformNode.h"
#import "Nodes/ABI29_0_0REAValueNode.h"
#import "Nodes/ABI29_0_0REABlockNode.h"
#import "Nodes/ABI29_0_0REACondNode.h"
#import "Nodes/ABI29_0_0REAOperatorNode.h"
#import "Nodes/ABI29_0_0REASetNode.h"
#import "Nodes/ABI29_0_0READebugNode.h"
#import "Nodes/ABI29_0_0REAClockNodes.h"
#import "Nodes/ABI29_0_0REAJSCallNode.h"
#import "Nodes/ABI29_0_0REABezierNode.h"
#import "Nodes/ABI29_0_0REAEventNode.h"

@implementation ABI29_0_0REANodesManager
{
  NSMutableDictionary<ABI29_0_0REANodeID, ABI29_0_0REANode *> *_nodes;
  NSMapTable<NSString *, ABI29_0_0REANode *> *_eventMapping;
  NSMutableArray<id<ABI29_0_0RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  ABI29_0_0REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  NSMutableArray<ABI29_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
}

- (instancetype)initWithModule:(ABI29_0_0REAModule *)reanimatedModule
                     uiManager:(ABI29_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [ABI29_0_0REAUpdateContext new];
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
  }
  return self;
}

- (void)invalidate
{
  [self stopUpdatingOnAnimationFrame];
}

- (ABI29_0_0REANode *)findNodeByID:(ABI29_0_0REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(ABI29_0_0REAOnAnimationCallback)clb
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
    id<ABI29_0_0RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<ABI29_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI29_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [ABI29_0_0REANode runPropUpdates:_updateContext];
  _wantRunUpdates = NO;

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

#pragma mark -- Graph

- (void)createNode:(ABI29_0_0REANodeID)nodeID
            config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{@"props": [ABI29_0_0REAPropsNode class],
            @"style": [ABI29_0_0REAStyleNode class],
            @"transform": [ABI29_0_0REATransformNode class],
            @"value": [ABI29_0_0REAValueNode class],
            @"block": [ABI29_0_0REABlockNode class],
            @"cond": [ABI29_0_0REACondNode class],
            @"op": [ABI29_0_0REAOperatorNode class],
            @"set": [ABI29_0_0REASetNode class],
            @"debug": [ABI29_0_0READebugNode class],
            @"clock": [ABI29_0_0REAClockNode class],
            @"clockStart": [ABI29_0_0REAClockStartNode class],
            @"clockStop": [ABI29_0_0REAClockStopNode class],
            @"clockTest": [ABI29_0_0REAClockTestNode class],
            @"call": [ABI29_0_0REAJSCallNode class],
            @"bezier": [ABI29_0_0REABezierNode class],
            @"event": [ABI29_0_0REAEventNode class],
//            @"listener": nil,
            };
  });

  NSString *nodeType = [ABI29_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI29_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI29_0_0REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(ABI29_0_0REANodeID)nodeID
{
  ABI29_0_0REANode *node = _nodes[nodeID];
  if (node) {
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull ABI29_0_0REANodeID)childID
{
  ABI29_0_0RCTAssertParam(parentID);
  ABI29_0_0RCTAssertParam(childID);

  ABI29_0_0REANode *parentNode = _nodes[parentID];
  ABI29_0_0REANode *childNode = _nodes[childID];

  ABI29_0_0RCTAssertParam(parentNode);
  ABI29_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(ABI29_0_0REANodeID)parentID childID:(ABI29_0_0REANodeID)childID
{
  ABI29_0_0RCTAssertParam(parentID);
  ABI29_0_0RCTAssertParam(childID);

  ABI29_0_0REANode *parentNode = _nodes[parentID];
  ABI29_0_0REANode *childNode = _nodes[childID];

  ABI29_0_0RCTAssertParam(parentNode);
  ABI29_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(ABI29_0_0REANodeID)nodeID
                  viewTag:(NSNumber *)viewTag
                 viewName:(NSString *)viewName
{
  ABI29_0_0RCTAssertParam(nodeID);
  ABI29_0_0REANode *node = _nodes[nodeID];
  ABI29_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI29_0_0REAPropsNode class]]) {
    [(ABI29_0_0REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(ABI29_0_0REANodeID)nodeID
                       viewTag:(NSNumber *)viewTag
{
  ABI29_0_0RCTAssertParam(nodeID);
  ABI29_0_0REANode *node = _nodes[nodeID];
  ABI29_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI29_0_0REAPropsNode class]]) {
    [(ABI29_0_0REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI29_0_0REANodeID)eventNodeID
{
  ABI29_0_0RCTAssertParam(eventNodeID);
  ABI29_0_0REANode *eventNode = _nodes[eventNodeID];
  ABI29_0_0RCTAssert([eventNode isKindOfClass:[ABI29_0_0REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  ABI29_0_0RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(ABI29_0_0REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, eventName];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<ABI29_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI29_0_0REAEventNode *eventNode = (ABI29_0_0REAEventNode *)[_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)dispatchEvent:(id<ABI29_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  ABI29_0_0REANode *eventNode = [_eventMapping objectForKey:key];

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
