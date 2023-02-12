#import "DevMenuREAAlwaysNode.h"
#import "DevMenuREABezierNode.h"
#import "DevMenuREABlockNode.h"
#import "DevMenuREACallFuncNode.h"
#import "DevMenuREAClockNodes.h"
#import "DevMenuREAConcatNode.h"
#import "DevMenuREACondNode.h"
#import "DevMenuREADebugNode.h"
#import "DevMenuREAEventNode.h"
#import "DevMenuREAFunctionNode.h"
#import "DevMenuREAJSCallNode.h"
#import "DevMenuREAModule.h"
#import "DevMenuREANode.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAOperatorNode.h"
#import "DevMenuREAParamNode.h"
#import "DevMenuREAPropsNode.h"
#import "DevMenuREASetNode.h"
#import "DevMenuREAStyleNode.h"
#import "DevMenuREATransformNode.h"
#import "DevMenuREAValueNode.h"
#import <React/RCTConvert.h>
#import <React/RCTShadowView.h>
#import <stdatomic.h>

// Interface below has been added in order to use private methods of RCTUIManager,
// RCTUIManager#UpdateView is a React Method which is exported to JS but in
// Objective-C it stays private
// RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface RCTUIManager (DevMenu)

- (void)updateView:(nonnull NSNumber *)reactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end

@interface RCTUIManager (DevMenuSyncUpdates)

- (BOOL)hasEnqueuedUICommands;

- (void)runSyncUIUpdatesWithObserver:(id<RCTUIManagerObserver>)observer;

@end

@interface DevMenuComponentUpdate : NSObject

@property (nonnull) NSMutableDictionary *props;
@property (nonnull) NSNumber *viewTag;
@property (nonnull) NSString *viewName;

@end

@implementation DevMenuComponentUpdate
@end

@implementation RCTUIManager (DevMenuSyncUpdates)

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

@interface DevMenuREANodesManager () <RCTUIManagerObserver>

@end

@implementation DevMenuREANodesManager {
  NSMutableDictionary<DevMenuREANodeID, DevMenuREANode *> *_nodes;
  NSMapTable<NSString *, DevMenuREANode *> *_eventMapping;
  NSMutableArray<id<RCTEvent>> *_eventQueue;
  CADisplayLink *_displayLink;
  DevMenuREAUpdateContext *_updateContext;
  BOOL _wantRunUpdates;
  BOOL _processingDirectEvent;
  NSMutableArray<DevMenuREAOnAnimationCallback> *_onAnimationCallbacks;
  NSMutableArray<DevMenuREANativeAnimationOp> *_operationsInBatch;
  BOOL _tryRunBatchUpdatesSynchronously;
  DevMenuREAEventHandler _eventHandler;
  volatile void (^_mounting)(void);
  NSMutableDictionary<NSNumber *, DevMenuComponentUpdate *> *_componentUpdateBuffer;
  volatile atomic_bool _shouldFlushUpdateBuffer;
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry;
}

- (instancetype)initWithModule:(DevMenuREAModule *)reanimatedModule uiManager:(RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
    _nodes = [NSMutableDictionary new];
    _eventMapping = [NSMapTable strongToWeakObjectsMapTable];
    _eventQueue = [NSMutableArray new];
    _updateContext = [DevMenuREAUpdateContext new];
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

- (DevMenuREANode *)findNodeByID:(DevMenuREANodeID)nodeID
{
  return _nodes[nodeID];
}

- (void)postOnAnimation:(DevMenuREAOnAnimationCallback)clb
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

- (void)registerEventHandler:(DevMenuREAEventHandler)eventHandler
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

  NSArray<DevMenuREAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (DevMenuREAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (BOOL)uiManager:(RCTUIManager *)manager performMountingWithBlock:(RCTUIManagerMountingBlock)block
{
  RCTAssert(_mounting == nil, @"Mouting block is expected to not be set");
  _mounting = block;
  return YES;
}

- (void)performOperations
{
  if (_wantRunUpdates) {
    [DevMenuREANode runPropUpdates:_updateContext];
  }
  if (_operationsInBatch.count != 0) {
    NSMutableArray<DevMenuREANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;

    __weak __typeof(self) weakSelf = self;
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

- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync
{
  if (trySync) {
    _tryRunBatchUpdatesSynchronously = YES;
  }
  [_operationsInBatch addObject:^(RCTUIManager *uiManager) {
    [uiManager updateView:reactTag viewName:viewName props:nativeProps];
  }];
}

- (void)getValue:(DevMenuREANodeID)nodeID callback:(RCTResponseSenderBlock)callback
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

- (void)createNode:(DevMenuREANodeID)nodeID config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{
      @"props" : [DevMenuREAPropsNode class],
      @"style" : [DevMenuREAStyleNode class],
      @"transform" : [DevMenuREATransformNode class],
      @"value" : [DevMenuREAValueNode class],
      @"block" : [DevMenuREABlockNode class],
      @"cond" : [DevMenuREACondNode class],
      @"op" : [DevMenuREAOperatorNode class],
      @"set" : [DevMenuREASetNode class],
      @"debug" : [DevMenuREADebugNode class],
      @"clock" : [DevMenuREAClockNode class],
      @"clockStart" : [DevMenuREAClockStartNode class],
      @"clockStop" : [DevMenuREAClockStopNode class],
      @"clockTest" : [DevMenuREAClockTestNode class],
      @"call" : [DevMenuREAJSCallNode class],
      @"bezier" : [DevMenuREABezierNode class],
      @"event" : [DevMenuREAEventNode class],
      @"always" : [DevMenuREAAlwaysNode class],
      @"concat" : [DevMenuREAConcatNode class],
      @"param" : [DevMenuREAParamNode class],
      @"func" : [DevMenuREAFunctionNode class],
      @"callfunc" : [DevMenuREACallFuncNode class]
      //            @"listener": nil,
    };
  });

  NSString *nodeType = [RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (!nodeClass) {
    RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  DevMenuREANode *node = [[nodeClass alloc] initWithID:nodeID config:config];
  node.nodesManager = self;
  node.updateContext = _updateContext;
  _nodes[nodeID] = node;
}

- (void)dropNode:(DevMenuREANodeID)nodeID
{
  DevMenuREANode *node = _nodes[nodeID];
  if (node) {
    [node onDrop];
    [_nodes removeObjectForKey:nodeID];
  }
}

- (void)connectNodes:(nonnull NSNumber *)parentID childID:(nonnull DevMenuREANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  DevMenuREANode *parentNode = _nodes[parentID];
  DevMenuREANode *childNode = _nodes[childID];

  RCTAssertParam(childNode);

  [parentNode addChild:childNode];
}

- (void)disconnectNodes:(DevMenuREANodeID)parentID childID:(DevMenuREANodeID)childID
{
  RCTAssertParam(parentID);
  RCTAssertParam(childID);

  DevMenuREANode *parentNode = _nodes[parentID];
  DevMenuREANode *childNode = _nodes[childID];

  RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
}

- (void)connectNodeToView:(DevMenuREANodeID)nodeID viewTag:(NSNumber *)viewTag viewName:(NSString *)viewName
{
  RCTAssertParam(nodeID);
  DevMenuREANode *node = _nodes[nodeID];
  RCTAssertParam(node);

  if ([node isKindOfClass:[DevMenuREAPropsNode class]]) {
    [(DevMenuREAPropsNode *)node connectToView:viewTag viewName:viewName];
  }
}

- (void)disconnectNodeFromView:(DevMenuREANodeID)nodeID viewTag:(NSNumber *)viewTag
{
  RCTAssertParam(nodeID);
  DevMenuREANode *node = _nodes[nodeID];
  RCTAssertParam(node);

  if ([node isKindOfClass:[DevMenuREAPropsNode class]]) {
    [(DevMenuREAPropsNode *)node disconnectFromView:viewTag];
  }
}

- (void)attachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(DevMenuREANodeID)eventNodeID
{
  RCTAssertParam(eventNodeID);
  DevMenuREANode *eventNode = _nodes[eventNodeID];
  RCTAssert([eventNode isKindOfClass:[DevMenuREAEventNode class]], @"Event node is of an invalid type");

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, RCTNormalizeInputEventName(eventName)];
  RCTAssert([_eventMapping objectForKey:key] == nil, @"Event handler already set for the given view and event type");
  [_eventMapping setObject:eventNode forKey:key];
}

- (void)detachEvent:(NSNumber *)viewTag eventName:(NSString *)eventName eventNodeID:(DevMenuREANodeID)eventNodeID
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, RCTNormalizeInputEventName(eventName)];
  [_eventMapping removeObjectForKey:key];
}

- (void)processEvent:(id<RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, RCTNormalizeInputEventName(event.eventName)];
  DevMenuREAEventNode *eventNode = [_eventMapping objectForKey:key];
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
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, RCTNormalizeInputEventName(event.eventName)];

  NSString *eventHash = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];

  if (_eventHandler != nil) {
    __weak DevMenuREAEventHandler eventHandler = _eventHandler;
    __weak __typeof(self) weakSelf = self;
    RCTExecuteOnMainQueue(^void() {
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

  DevMenuREANode *eventNode = [_eventMapping objectForKey:key];

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
  RCTAssertParam(nodeID);

  DevMenuREANode *node = _nodes[nodeID];

  DevMenuREAValueNode *valueNode = (DevMenuREAValueNode *)node;
  [valueNode setValue:newValue];
}

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName
{
  DevMenuComponentUpdate *lastSnapshot = _componentUpdateBuffer[viewTag];
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
      DevMenuComponentUpdate *propsSnapshot = [DevMenuComponentUpdate new];
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
  UIView *view = [self.uiManager viewForReactTag:viewTag];

  NSString *result =
      [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];

  if ([propName isEqualToString:@"opacity"]) {
    CGFloat alpha = view.alpha;
    result = [@(alpha) stringValue];
  } else if ([propName isEqualToString:@"zIndex"]) {
    NSInteger zIndex = view.reactZIndex;
    result = [@(zIndex) stringValue];
  }

  return result;
}

- (void)maybeFlushUpdateBuffer
{
  RCTAssertUIManagerQueue();
  bool shouldFlushUpdateBuffer = atomic_load(&_shouldFlushUpdateBuffer);
  if (!shouldFlushUpdateBuffer) {
    return;
  }

  __weak __typeof(self) weakSelf = self;
  [_uiManager addUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    atomic_store(&strongSelf->_shouldFlushUpdateBuffer, false);
    NSMutableDictionary *componentUpdateBuffer = [strongSelf->_componentUpdateBuffer copy];
    strongSelf->_componentUpdateBuffer = [NSMutableDictionary new];
    for (NSNumber *tag in componentUpdateBuffer) {
      DevMenuComponentUpdate *componentUpdate = componentUpdateBuffer[tag];
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
