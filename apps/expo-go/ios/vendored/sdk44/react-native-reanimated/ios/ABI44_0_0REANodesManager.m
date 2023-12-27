#import "ABI44_0_0REANodesManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>

#import <ABI44_0_0React/ABI44_0_0RCTShadowView.h>
#import "Nodes/ABI44_0_0REAAlwaysNode.h"
#import "Nodes/ABI44_0_0REABezierNode.h"
#import "Nodes/ABI44_0_0REABlockNode.h"
#import "Nodes/ABI44_0_0REACallFuncNode.h"
#import "Nodes/ABI44_0_0REAClockNodes.h"
#import "Nodes/ABI44_0_0REAConcatNode.h"
#import "Nodes/ABI44_0_0REACondNode.h"
#import "Nodes/ABI44_0_0READebugNode.h"
#import "Nodes/ABI44_0_0REAEventNode.h"
#import "Nodes/ABI44_0_0REAFunctionNode.h"
#import "Nodes/ABI44_0_0REAJSCallNode.h"
#import "Nodes/ABI44_0_0REANode.h"
#import "Nodes/ABI44_0_0REAOperatorNode.h"
#import "Nodes/ABI44_0_0REAParamNode.h"
#import "Nodes/ABI44_0_0REAPropsNode.h"
#import "Nodes/ABI44_0_0REASetNode.h"
#import "Nodes/ABI44_0_0REAStyleNode.h"
#import "Nodes/ABI44_0_0REATransformNode.h"
#import "Nodes/ABI44_0_0REAValueNode.h"
#import "ABI44_0_0REAModule.h"

// Interface below has been added in order to use private methods of ABI44_0_0RCTUIManager,
// ABI44_0_0RCTUIManager#UpdateView is a ABI44_0_0React Method which is exported to JS but in
// Objective-C it stays private
// ABI44_0_0RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface ABI44_0_0RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)ABI44_0_0ReactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end

@interface ABI44_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands;

- (void)runSyncUIUpdatesWithObserver:(id<ABI44_0_0RCTUIManagerObserver>)observer;

@end

@implementation ABI44_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands
{
  // Accessing some private bits of ABI44_0_0RCTUIManager to provide missing functionality
  return [[self valueForKey:@"_pendingUIBlocks"] count] > 0;
}

- (void)runSyncUIUpdatesWithObserver:(id<ABI44_0_0RCTUIManagerObserver>)observer
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
  NSHashTable<id<ABI44_0_0RCTUIManagerObserver>> *soleObserver = [NSHashTable new];
  [soleObserver addObject:observer];
  [self.observerCoordinator setValue:soleObserver forKey:@"_observers"];

  // run batch
  [self batchDidComplete];
  // restore old observers table
  [self.observerCoordinator setValue:oldObservers forKey:@"_observers"];
}

@end

@interface ABI44_0_0REANodesManager () <ABI44_0_0RCTUIManagerObserver>

@end

@implementation ABI44_0_0REANodesManager {
  NSMutableDictionary<ABI44_0_0REANodeID, ABI44_0_0REANode *> *_nodes;
  NSMapTable<NSString *, ABI44_0_0REANode *> *_eventMapping;
  NSMutableArray<id<ABI44_0_0RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  ABI44_0_0REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  BOOL _processingDirectEvent;
  NSMutableArray<ABI44_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
  NSMutableArray<ABI44_0_0REANativeAnimationOp> *_operationsInBatch;
  BOOL _tryRunBatchUpdatesSynchronously;
  ABI44_0_0REAEventHandler _eventHandler;
  volatile void (^_mounting)(void);
}

- (instancetype)initWithModule:(ABI44_0_0REAModule *)reanimatedModule uiManager:(ABI44_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [ABI44_0_0REAUpdateContext new];
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
    _operationsInBatch = [NSMutableArray new];
  }

  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onAnimationFrame:)];
  _displayLink.preferredFramesPerSecond = 120; // will fallback to 60 fps for devices without Pro Motion display
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

- (ABI44_0_0REANode *)findNodeByID:(ABI44_0_0REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(ABI44_0_0REAOnAnimationCallback)clb
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

- (void)registerEventHandler:(ABI44_0_0REAEventHandler)eventHandler
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
    id<ABI44_0_0RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<ABI44_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI44_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (BOOL)uiManager:(ABI44_0_0RCTUIManager *)manager performMountingWithBlock:(ABI44_0_0RCTUIManagerMountingBlock)block
{
  ABI44_0_0RCTAssert(_mounting == nil, @"Mouting block is expected to not be set");
  _mounting = block;
  return YES;
}

- (void)performOperations
{
  if (_wantRunUpdates) {
    [ABI44_0_0REANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<ABI44_0_0REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;

    __weak typeof(self) weakSelf = self;
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    ABI44_0_0RCTExecuteOnUIManagerQueue(^{
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
      // In case canUpdateSynchronously=true we still have to send uiManagerWillPerformMounting event
      // to observers because some components (e.g. TextInput) update their UIViews only on that event.
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

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI44_0_0ReactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync
{
  if (trySync) {
    _tryRunBatchUpdatesSynchronously = YES;
  }
  [_operationsInBatch addObject:^(ABI44_0_0RCTUIManager *uiManager) {
    [uiManager updateView:ABI44_0_0ReactTag viewName:viewName props:nativeProps];
  }];
}

- (void)getValue:(ABI44_0_0REANodeID)nodeID callback:(ABI44_0_0RCTResponseSenderBlock)callback
{
  id val = _nodes[nodeID].value;
  if (val) {
    callback(@[ val ]);
  } else {
    // NULL is not an object and it's not possible to pass it as callback's argument
    callback(@[ [NSNull null] ]);
  }
}

#pragma mark-- Graph

- (void)createNode:(ABI44_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{
      @"props" : [ABI44_0_0REAPropsNode class],
      @"style" : [ABI44_0_0REAStyleNode class],
      @"transform" : [ABI44_0_0REATransformNode class],
      @"value" : [ABI44_0_0REAValueNode class],
      @"block" : [ABI44_0_0REABlockNode class],
      @"cond" : [ABI44_0_0REACondNode class],
      @"op" : [ABI44_0_0REAOperatorNode class],
      @"set" : [ABI44_0_0REASetNode class],
      @"debug" : [ABI44_0_0READebugNode class],
      @"clock" : [ABI44_0_0REAClockNode class],
      @"clockStart" : [ABI44_0_0REAClockStartNode class],
      @"clockStop" : [ABI44_0_0REAClockStopNode class],
      @"clockTest" : [ABI44_0_0REAClockTestNode class],
      @"call" : [ABI44_0_0REAJSCallNode class],
      @"bezier" : [ABI44_0_0REABezierNode class],
      @"event" : [ABI44_0_0REAEventNode class],
      @"always" : [ABI44_0_0REAAlwaysNode class],
      @"concat" : [ABI44_0_0REAConcatNode class],
      @"param" : [ABI44_0_0REAParamNode class],
      @"func" : [ABI44_0_0REAFunctionNode class],
      @"callfunc" : [ABI44_0_0REACallFuncNode class]
      //            @"listener": nil,
    };
  });

  NSString *nodeType = [ABI44_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI44_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI44_0_0REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(ABI44_0_0REANodeID)nodeID
{
  ABI44_0_0REANode *node = _nodes[nodeID];
  if (node) {
    [node onDrop];
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull ABI44_0_0REANodeID)childID
{
  ABI44_0_0RCTAssertParam(parentID);
  ABI44_0_0RCTAssertParam(childID);

  ABI44_0_0REANode *parentNode = _nodes[parentID];
  ABI44_0_0REANode *childNode = _nodes[childID];

  ABI44_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(ABI44_0_0REANodeID)parentID childID:(ABI44_0_0REANodeID)childID
{
  ABI44_0_0RCTAssertParam(parentID);
  ABI44_0_0RCTAssertParam(childID);

  ABI44_0_0REANode *parentNode = _nodes[parentID];
  ABI44_0_0REANode *childNode = _nodes[childID];

  ABI44_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(ABI44_0_0REANodeID)nodeID viewTag:(NSNumber *)viewTag viewName:(NSString *)viewName
{
  ABI44_0_0RCTAssertParam(nodeID);
  ABI44_0_0REANode *node = _nodes[nodeID];
  ABI44_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI44_0_0REAPropsNode class]]) {
    [(ABI44_0_0REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(ABI44_0_0REANodeID)nodeID viewTag:(NSNumber *)viewTag
{
  ABI44_0_0RCTAssertParam(nodeID);
  ABI44_0_0REANode *node = _nodes[nodeID];
  ABI44_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI44_0_0REAPropsNode class]]) {
    [(ABI44_0_0REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(ABI44_0_0REANodeID)eventNodeID
{
  ABI44_0_0RCTAssertParam(eventNodeID);
  ABI44_0_0REANode *eventNode = _nodes[eventNodeID];
  ABI44_0_0RCTAssert([eventNode isKindOfClass:[ABI44_0_0REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI44_0_0RCTNormalizeInputEventName(eventName)];
  ABI44_0_0RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(ABI44_0_0REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI44_0_0RCTNormalizeInputEventName(eventName)];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<ABI44_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI44_0_0RCTNormalizeInputEventName(event.eventName)];
  ABI44_0_0REAEventNode *eventNode = [_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)processDirectEvent:(id<ABI44_0_0RCTEvent>)event
{
  _processingDirectEvent = YES;
  [self processEvent:event];
  [self performOperations];
  _processingDirectEvent = NO;
}

- (BOOL)isDirectEvent:(id<ABI44_0_0RCTEvent>)event
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

  return [directEventNames containsObject:ABI44_0_0RCTNormalizeInputEventName(event.eventName)];
}

- (void)dispatchEvent:(id<ABI44_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI44_0_0RCTNormalizeInputEventName(event.eventName)];

  NSString *eventHash = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];

  if (_eventHandler != nil) {
    __weak ABI44_0_0REAEventHandler eventHandler = _eventHandler;
    __weak typeof(self) weakSelf = self;
    ABI44_0_0RCTExecuteOnMainQueue(^void() {
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      if (eventHandler == nil) {
        return;
      }
      eventHandler(eventHash, event);
      if ([strongSelf isDirectEvent:event]) {
        [strongSelf performOperations];
      }
    });
  }

  ABI44_0_0REANode *eventNode = [_eventMapping objectForKey:key];

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

- (void)configureProps:(NSSet<NSString *> *)nativeProps uiProps:(NSSet<NSString *> *)uiProps
{
  _uiProps = uiProps;
  _nativeProps = nativeProps;
}

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue
{
  ABI44_0_0RCTAssertParam(nodeID);

  ABI44_0_0REANode *node = _nodes[nodeID];

  ABI44_0_0REAValueNode *valueNode = (ABI44_0_0REAValueNode *)node;
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

  void (^addBlock)(NSString *key, id obj, BOOL *stop) = ^(NSString *key, id obj, BOOL *stop) {
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
    [self.uiManager synchronouslyUpdateViewOnUIThread:viewTag viewName:viewName props:uiProps];
  }
  if (nativeProps.count > 0) {
    [self enqueueUpdateViewOnNativeThread:viewTag viewName:viewName nativeProps:nativeProps trySynchronously:YES];
  }
  if (jsProps.count > 0) {
    [self.reanimatedModule sendEventWithName:@"onReanimatedPropsChange"
                                        body:@{@"viewTag" : viewTag, @"props" : jsProps}];
  }
}

- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName
{
  UIView *view = [self.uiManager viewForABI44_0_0ReactTag:viewTag];

  NSString *result =
      [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];

  if ([propName isEqualToString:@"opacity"]) {
    CGFloat alpha = view.alpha;
    result = [@(alpha) stringValue];
  } else if ([propName isEqualToString:@"zIndex"]) {
    NSInteger zIndex = view.ABI44_0_0ReactZIndex;
    result = [@(zIndex) stringValue];
  }

  return result;
}

@end
