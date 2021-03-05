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
#import <React/RCTShadowView.h>

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

@interface RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands;

- (void)runSyncUIUpdatesWithObserver:(id<RCTUIManagerObserver>)observer;

@end

@implementation RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands
{
  // Accessing some private bits of RCTUIManager to provide missing functionality
  return [[self valueForKey:@"_pendingUIBlocks"] count] > 0;
}

- (void)runSyncUIUpdatesWithObserver:(id<RCTUIManagerObserver>)observer
{
  // before we run uimanager batch complete, we override coordinator observers list
  // to avoid observers from firing. This is done because we only want the uimanager
  // related operations to run and not all other operations (including the ones enqueued
  // by reanimated or native animated modules) from being scheduled. If we were to allow
  // other modules to execute some logic from this sync uimanager run there is a possibility
  // that the commands will execute out of order or that we intercept a batch of commands that
  // those modules may be in a middle of (we verify that batch isn't in progress for uimodule
  // but can't do the same for all remaining modules)

  // store reference to the observers array
  id oldObservers = [self.observerCoordinator valueForKey:@"_observers"];

  // temporarily replace observers with a table conatining just nodesmanager (we need
  // this to capture mounting block)
  NSHashTable<id<RCTUIManagerObserver>> *soleObserver = [NSHashTable new];
  [soleObserver addObject:observer];
  [self.observerCoordinator setValue:soleObserver forKey:@"_observers"];

  // run batch
  [self batchDidComplete];
  // restore old observers table
  [self.observerCoordinator setValue:oldObservers forKey:@"_observers"];
}

@end

@interface REANodesManager() <RCTUIManagerObserver>

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
  BOOL _tryRunBatchUpdatesSynchronously;
  REAEventHandler _eventHandler;
  volatile void (^_mounting)(void);
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
    
  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onAnimationFrame:)];
  [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  [_displayLink setPaused:true];
  return self;
}

- (void)invalidate
{
  _eventHandler = nil;
  [self stopUpdatingOnAnimationFrame];
}

- (void)operationsBatchDidComplete
{
  if (![_displayLink isPaused]) {
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

- (void)registerEventHandler:(REAEventHandler)eventHandler
{
  _eventHandler = eventHandler;
}

- (void)startUpdatingOnAnimationFrame
{
    // Setting _currentAnimationTimestamp here is connected with manual triggering of performOperations
    // in operationsBatchDidComplete. If new node has been created and clock has not been started,
    // _displayLink won't be initialized soon enough and _displayLink.timestamp will be 0.
    // However, CADisplayLink is using CACurrentMediaTime so if there's need to perform one more
    // evaluation, it could be used it here. In usual case, CACurrentMediaTime is not being used in
    // favor of setting it with _displayLink.timestamp in onAnimationFrame method.
    _currentAnimationTimestamp = CACurrentMediaTime();
    [_displayLink setPaused:false];
}

- (void)stopUpdatingOnAnimationFrame
{
  if (_displayLink) {
    [_displayLink setPaused:true];
  }
}

- (void)onAnimationFrame:(CADisplayLink *)displayLink
{
  _currentAnimationTimestamp = _displayLink.timestamp;

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

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (BOOL)uiManager:(RCTUIManager *)manager performMountingWithBlock:(RCTUIManagerMountingBlock)block {
  RCTAssert(_mounting == nil, @"Mouting block is expected to not be set");
  _mounting = block;
  return YES;
}

- (void)performOperations
{
  if (_wantRunUpdates) {
    [REANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;
    
    __weak typeof(self) weakSelf = self;
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    RCTExecuteOnUIManagerQueue(^{
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      BOOL canUpdateSynchronously = trySynchronously && ![strongSelf.uiManager hasEnqueuedUICommands];
      
      if (!canUpdateSynchronously) {
        dispatch_semaphore_signal(semaphore);
      }
      
      for (int i = 0; i < copiedOperationsQueue.count; i++) {
        copiedOperationsQueue[i](strongSelf.uiManager);
      }
      
      if (canUpdateSynchronously) {
        [strongSelf.uiManager runSyncUIUpdatesWithObserver:self];
        dispatch_semaphore_signal(semaphore);
      }
      //In case canUpdateSynchronously=true we still have to send uiManagerWillPerformMounting event 
      //to observers because some components (e.g. TextInput) update their UIViews only on that event.
      [strongSelf.uiManager setNeedsLayout];
    });
    if (trySynchronously) {
      dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    }
    
    if (_mounting) {
      _mounting();
      _mounting = nil;
    }
  }
  _wantRunUpdates = NO;
}

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync {
  if (trySync) {
    _tryRunBatchUpdatesSynchronously = YES;
  }
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
            @"callfunc": [REACallFuncNode class]
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
    [node onDrop];
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull REANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  REANode *parentNode = _nodes[parentID];
  REANode *childNode = _nodes[childID];

  RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(REANodeID)parentID childID:(REANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  REANode *parentNode = _nodes[parentID];
  REANode *childNode = _nodes[childID];

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

  NSString *key = [NSString stringWithFormat:@"%@%@",
                   viewTag,
                   RCTNormalizeInputEventName(eventName)];
  RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag
          eventName:(NSString *)eventName
        eventNodeID:(REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@",
                   viewTag,
                   RCTNormalizeInputEventName(eventName)];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@",
                   event.viewTag,
                   RCTNormalizeInputEventName(event.eventName)];
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
      @"topContentSizeChange",
      @"topMomentumScrollBegin",
      @"topMomentumScrollEnd",
      @"topScroll",
      @"topScrollBeginDrag",
      @"topScrollEndDrag"
    ];
  });

  return [directEventNames containsObject:RCTNormalizeInputEventName(event.eventName)];
}

- (void)dispatchEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@",
                   event.viewTag,
                   RCTNormalizeInputEventName(event.eventName)];

  NSString *eventHash = [NSString stringWithFormat:@"%@%@",
  event.viewTag,
  event.eventName];

  if (_eventHandler != nil) {
    __weak REAEventHandler eventHandler = _eventHandler;
    __weak typeof(self) weakSelf = self;
    RCTExecuteOnMainQueue(^void(){
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      eventHandler(eventHash, event);
      if ([strongSelf isDirectEvent:event]) {
        [strongSelf performOperations];
      }
    });
  }

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

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue
{
  RCTAssertParam(nodeID);

  REANode *node = _nodes[nodeID];

  REAValueNode *valueNode = (REAValueNode *)node;
  [valueNode setValue:newValue];
}

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName
{
  // TODO: refactor PropsNode to also use this function
  NSMutableDictionary *uiProps = [NSMutableDictionary new];
  NSMutableDictionary *nativeProps = [NSMutableDictionary new];
  NSMutableDictionary *jsProps = [NSMutableDictionary new];

  void (^addBlock)(NSString *key, id obj, BOOL * stop) = ^(NSString *key, id obj, BOOL * stop){
    if ([self.uiProps containsObject:key]) {
      uiProps[key] = obj;
    } else if ([self.nativeProps containsObject:key]) {
      nativeProps[key] = obj;
    } else {
      jsProps[key] = obj;
    }
  };

  [props enumerateKeysAndObjectsUsingBlock:addBlock];

  if (uiProps.count > 0) {
    [self.uiManager
     synchronouslyUpdateViewOnUIThread:viewTag
     viewName:viewName
     props:uiProps];
    }
    if (nativeProps.count > 0) {
      [self enqueueUpdateViewOnNativeThread:viewTag viewName:viewName nativeProps:nativeProps trySynchronously:YES];
    }
    if (jsProps.count > 0) {
      [self.reanimatedModule sendEventWithName:@"onReanimatedPropsChange"
                                          body:@{@"viewTag": viewTag, @"props": jsProps }];
    }
}

- (NSString*)obtainProp:(nonnull NSNumber *)viewTag
               propName:(nonnull NSString *)propName
{
    UIView* view = [self.uiManager viewForReactTag:viewTag];
    
    NSString* result = [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];
    
    if ([propName isEqualToString:@"opacity"]) {
        CGFloat alpha = view.alpha;
        result = [@(alpha) stringValue];
    } else if ([propName isEqualToString:@"zIndex"]) {
        NSInteger zIndex = view.reactZIndex;
        result = [@(zIndex) stringValue];
    }
    
    return result;
}

@end
