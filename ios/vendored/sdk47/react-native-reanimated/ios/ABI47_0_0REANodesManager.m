#import <ABI47_0_0RNReanimated/ABI47_0_0REAAlwaysNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REABezierNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REABlockNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REACallFuncNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAClockNodes.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAConcatNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REACondNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0READebugNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAEventNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAFunctionNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAJSCallNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAModule.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REANode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REANodesManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAOperatorNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAParamNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAPropsNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REASetNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAStyleNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REATransformNode.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAValueNode.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTShadowView.h>
#import <stdatomic.h>

// Interface below has been added in order to use private methods of ABI47_0_0RCTUIManager,
// ABI47_0_0RCTUIManager#UpdateView is a ABI47_0_0React Method which is exported to JS but in
// Objective-C it stays private
// ABI47_0_0RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface ABI47_0_0RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)ABI47_0_0ReactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end

@interface ABI47_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands;

- (void)runSyncUIUpdatesWithObserver:(id<ABI47_0_0RCTUIManagerObserver>)observer;

@end

@interface ABI47_0_0ComponentUpdate : NSObject

@property (nonnull) NSMutableDictionary *props;
@property (nonnull) NSNumber *viewTag;
@property (nonnull) NSString *viewName;

@end

@implementation ABI47_0_0ComponentUpdate
@end

@implementation ABI47_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands
{
  // Accessing some private bits of ABI47_0_0RCTUIManager to provide missing functionality
  return [[self valueForKey:@"_pendingUIBlocks"] count] > 0;
}

- (void)runSyncUIUpdatesWithObserver:(id<ABI47_0_0RCTUIManagerObserver>)observer
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
  NSHashTable<id<ABI47_0_0RCTUIManagerObserver>> *soleObserver = [NSHashTable new];
  [soleObserver addObject:observer];
  [self.observerCoordinator setValue:soleObserver forKey:@"_observers"];

  // run batch
  [self batchDidComplete];
  // restore old observers table
  [self.observerCoordinator setValue:oldObservers forKey:@"_observers"];
}

@end

@interface ABI47_0_0REANodesManager () <ABI47_0_0RCTUIManagerObserver>

@end

@implementation ABI47_0_0REANodesManager {
  NSMutableDictionary<ABI47_0_0REANodeID, ABI47_0_0REANode *> *_nodes;
  NSMapTable<NSString *, ABI47_0_0REANode *> *_eventMapping;
  NSMutableArray<id<ABI47_0_0RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  ABI47_0_0REAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  BOOL _processingDirectEvent;
  NSMutableArray<ABI47_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
  NSMutableArray<ABI47_0_0REANativeAnimationOp> *_operationsInBatch;
  BOOL _tryRunBatchUpdatesSynchronously;
  ABI47_0_0REAEventHandler _eventHandler;
  volatile void (^_mounting)(void);
  NSMutableDictionary<NSNumber *, ABI47_0_0ComponentUpdate *> *_componentUpdateBuffer;
  volatile atomic_bool _shouldFlushUpdateBuffer;
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry;
}

- (instancetype)initWithModule:(ABI47_0_0REAModule *)reanimatedModule uiManager:(ABI47_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [ABI47_0_0REAUpdateContext new];
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
    _operationsInBatch = [NSMutableArray new];
    _componentUpdateBuffer = [NSMutableDictionary new];
    _viewRegistry = [_uiManager valueForKey:@"_viewRegistry"];
    _shouldFlushUpdateBuffer = false;
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
  [_displayLink invalidate];
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

- (ABI47_0_0REANode *)findNodeByID:(ABI47_0_0REANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(ABI47_0_0REAOnAnimationCallback)clb
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

- (void)registerEventHandler:(ABI47_0_0REAEventHandler)eventHandler
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
    id<ABI47_0_0RCTEvent> event = _eventQueue[i];
    [self processEvent:event];
  }
  [_eventQueue removeAllObjects];

  NSArray<ABI47_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI47_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (BOOL)uiManager:(ABI47_0_0RCTUIManager *)manager performMountingWithBlock:(ABI47_0_0RCTUIManagerMountingBlock)block
{
  ABI47_0_0RCTAssert(_mounting == nil, @"Mouting block is expected to not be set");
  _mounting = block;
  return YES;
}

- (void)performOperations
{
  if (_wantRunUpdates) {
    [ABI47_0_0REANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<ABI47_0_0REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;

    __weak typeof(self) weakSelf = self;
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
    ABI47_0_0RCTExecuteOnUIManagerQueue(^{
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

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI47_0_0ReactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync
{
  if (trySync) {
    _tryRunBatchUpdatesSynchronously = YES;
  }
  [_operationsInBatch addObject:^(ABI47_0_0RCTUIManager *uiManager) {
    [uiManager updateView:ABI47_0_0ReactTag viewName:viewName props:nativeProps];
  }];
}

- (void)getValue:(ABI47_0_0REANodeID)nodeID callback:(ABI47_0_0RCTResponseSenderBlock)callback
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

- (void)createNode:(ABI47_0_0REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{
      @"props" : [ABI47_0_0REAPropsNode class],
      @"style" : [ABI47_0_0REAStyleNode class],
      @"transform" : [ABI47_0_0REATransformNode class],
      @"value" : [ABI47_0_0REAValueNode class],
      @"block" : [ABI47_0_0REABlockNode class],
      @"cond" : [ABI47_0_0REACondNode class],
      @"op" : [ABI47_0_0REAOperatorNode class],
      @"set" : [ABI47_0_0REASetNode class],
      @"debug" : [ABI47_0_0READebugNode class],
      @"clock" : [ABI47_0_0REAClockNode class],
      @"clockStart" : [ABI47_0_0REAClockStartNode class],
      @"clockStop" : [ABI47_0_0REAClockStopNode class],
      @"clockTest" : [ABI47_0_0REAClockTestNode class],
      @"call" : [ABI47_0_0REAJSCallNode class],
      @"bezier" : [ABI47_0_0REABezierNode class],
      @"event" : [ABI47_0_0REAEventNode class],
      @"always" : [ABI47_0_0REAAlwaysNode class],
      @"concat" : [ABI47_0_0REAConcatNode class],
      @"param" : [ABI47_0_0REAParamNode class],
      @"func" : [ABI47_0_0REAFunctionNode class],
      @"callfunc" : [ABI47_0_0REACallFuncNode class]
      //            @"listener": nil,
    };
  });

  NSString *nodeType = [ABI47_0_0RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    ABI47_0_0RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  ABI47_0_0REANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(ABI47_0_0REANodeID)nodeID
{
  ABI47_0_0REANode *node = _nodes[nodeID];
  if (node) {
    [node onDrop];
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull ABI47_0_0REANodeID)childID
{
  ABI47_0_0RCTAssertParam(parentID);
  ABI47_0_0RCTAssertParam(childID);

  ABI47_0_0REANode *parentNode = _nodes[parentID];
  ABI47_0_0REANode *childNode = _nodes[childID];

  ABI47_0_0RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(ABI47_0_0REANodeID)parentID childID:(ABI47_0_0REANodeID)childID
{
  ABI47_0_0RCTAssertParam(parentID);
  ABI47_0_0RCTAssertParam(childID);

  ABI47_0_0REANode *parentNode = _nodes[parentID];
  ABI47_0_0REANode *childNode = _nodes[childID];

  ABI47_0_0RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(ABI47_0_0REANodeID)nodeID viewTag:(NSNumber *)viewTag viewName:(NSString *)viewName
{
  ABI47_0_0RCTAssertParam(nodeID);
  ABI47_0_0REANode *node = _nodes[nodeID];
  ABI47_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI47_0_0REAPropsNode class]]) {
    [(ABI47_0_0REAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(ABI47_0_0REANodeID)nodeID viewTag:(NSNumber *)viewTag
{
  ABI47_0_0RCTAssertParam(nodeID);
  ABI47_0_0REANode *node = _nodes[nodeID];
  ABI47_0_0RCTAssertParam(node);

  if ([node isKindOfClass:[ABI47_0_0REAPropsNode class]]) {
    [(ABI47_0_0REAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(ABI47_0_0REANodeID)eventNodeID
{
  ABI47_0_0RCTAssertParam(eventNodeID);
  ABI47_0_0REANode *eventNode = _nodes[eventNodeID];
  ABI47_0_0RCTAssert([eventNode isKindOfClass:[ABI47_0_0REAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI47_0_0RCTNormalizeInputEventName(eventName)];
  ABI47_0_0RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(ABI47_0_0REANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, ABI47_0_0RCTNormalizeInputEventName(eventName)];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<ABI47_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI47_0_0RCTNormalizeInputEventName(event.eventName)];
  ABI47_0_0REAEventNode *eventNode = [_eventMapping objectForKey:key];
  [eventNode processEvent:event];
}

- (void)processDirectEvent:(id<ABI47_0_0RCTEvent>)event
{
  _processingDirectEvent = YES;
  [self processEvent:event];
  [self performOperations];
  _processingDirectEvent = NO;
}

- (BOOL)isDirectEvent:(id<ABI47_0_0RCTEvent>)event
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

  return [directEventNames containsObject:ABI47_0_0RCTNormalizeInputEventName(event.eventName)];
}

- (void)dispatchEvent:(id<ABI47_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI47_0_0RCTNormalizeInputEventName(event.eventName)];

  NSString *eventHash = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];

  if (_eventHandler != nil) {
    __weak ABI47_0_0REAEventHandler eventHandler = _eventHandler;
    __weak typeof(self) weakSelf = self;
    ABI47_0_0RCTExecuteOnMainQueue(^void() {
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

  ABI47_0_0REANode *eventNode = [_eventMapping objectForKey:key];

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

- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet
{
  _uiProps = uiPropsSet;
  _nativeProps = nativePropsSet;
}

- (BOOL)isNativeViewMounted:(NSNumber *)viewTag
{
  return _viewRegistry[viewTag].superview != nil;
}

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue
{
  ABI47_0_0RCTAssertParam(nodeID);

  ABI47_0_0REANode *node = _nodes[nodeID];

  ABI47_0_0REAValueNode *valueNode = (ABI47_0_0REAValueNode *)node;
  [valueNode setValue:newValue];
}

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName
{
  ABI47_0_0ComponentUpdate *lastSnapshot = _componentUpdateBuffer[viewTag];
  BOOL isNativeViewMounted = [self isNativeViewMounted:viewTag];

  if (lastSnapshot != nil) {
    NSMutableDictionary *lastProps = lastSnapshot.props;
    for (NSString *key in props) {
      [lastProps setValue:props[key] forKey:key];
    }
  }

  // If the component isn't mounted, we will bail early with a scheduled update
  if (!isNativeViewMounted) {
    if (lastSnapshot == nil) {
      ABI47_0_0ComponentUpdate *propsSnapshot = [ABI47_0_0ComponentUpdate new];
      propsSnapshot.props = [props mutableCopy];
      propsSnapshot.viewTag = viewTag;
      propsSnapshot.viewName = viewName;
      _componentUpdateBuffer[viewTag] = propsSnapshot;
      atomic_store(&_shouldFlushUpdateBuffer, true);
    }

    return;
  }

  // The component may have been mounted with a pending snapshot (due to a race condition),
  // so we should attempt run the update. Otherwise, the next call to -maybeFlushUpdateBuffer
  // will only arrive when a new component is mounted (which might be never!)
  //
  // If there are 0 remaining items in the buffer, we can skip the run in -maybeFlushUpdateBuffer.
  if (lastSnapshot != nil && isNativeViewMounted) {
    props = lastSnapshot.props;
    viewTag = lastSnapshot.viewTag;
    viewName = lastSnapshot.viewName;

    [_componentUpdateBuffer removeObjectForKey:viewTag];

    if (_componentUpdateBuffer.count == 0) {
      atomic_store(&_shouldFlushUpdateBuffer, false);
    }
  }

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
  UIView *view = [self.uiManager viewForABI47_0_0ReactTag:viewTag];

  NSString *result =
      [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];

  if ([propName isEqualToString:@"opacity"]) {
    CGFloat alpha = view.alpha;
    result = [@(alpha) stringValue];
  } else if ([propName isEqualToString:@"zIndex"]) {
    NSInteger zIndex = view.ABI47_0_0ReactZIndex;
    result = [@(zIndex) stringValue];
  }

  return result;
}

- (void)maybeFlushUpdateBuffer
{
  ABI47_0_0RCTAssertUIManagerQueue();
  bool shouldFlushUpdateBuffer = atomic_load(&_shouldFlushUpdateBuffer);
  if (!shouldFlushUpdateBuffer) {
    return;
  }

  __weak typeof(self) weakSelf = self;
  [_uiManager addUIBlock:^(__unused ABI47_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    atomic_store(&strongSelf->_shouldFlushUpdateBuffer, false);
    NSMutableDictionary *componentUpdateBuffer = [strongSelf->_componentUpdateBuffer copy];
    strongSelf->_componentUpdateBuffer = [NSMutableDictionary new];
    for (NSNumber *tag in componentUpdateBuffer) {
      ABI47_0_0ComponentUpdate *componentUpdate = componentUpdateBuffer[tag];
      if (componentUpdate == Nil) {
        continue;
      }
      [strongSelf updateProps:componentUpdate.props
                ofViewWithTag:componentUpdate.viewTag
                     withName:componentUpdate.viewName];
    }
    [strongSelf performOperations];
  }];
}

@end
