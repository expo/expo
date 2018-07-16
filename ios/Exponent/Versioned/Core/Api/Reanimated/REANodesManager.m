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

@implementation REANodesManager
{
  NSMutableDictionary<REANodeID, REANode *> *_nodes;
  NSMapTable<NSString *, REANode *> *_eventMapping;
  NSMutableArray<id<RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  NSMutableArray<REAOnAnimationCallback> *_onAnimationCallbacks;
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
  }
  return self;
}

- (void)invalidate
{
  [self stopUpdatingOnAnimationFrame];
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

  [REANode runPropUpdates:_updateContext];
  _wantRunUpdates = NO;

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
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

- (void)dispatchEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];
  REANode *eventNode = [_eventMapping objectForKey:key];

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
