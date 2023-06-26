#import <ABI49_0_0RNReanimated/ABI49_0_0REAModule.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REANodesManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTComponentViewRegistry.h>
#import <ABI49_0_0React/ABI49_0_0RCTMountingManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenter.h>
#import <react/renderer/core/ShadowNode.h>
#import <react/renderer/uimanager/UIManager.h>
#else
#import <stdatomic.h>
#endif

#if __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreenStackHeaderConfig.h>)
#import <ABI49_0_0RNScreens/ABI49_0_0RNSScreenStackHeaderConfig.h>
#endif

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
using namespace ABI49_0_0facebook::ABI49_0_0React;
#endif

// Interface below has been added in order to use private methods of ABI49_0_0RCTUIManager,
// ABI49_0_0RCTUIManager#UpdateView is a ABI49_0_0React Method which is exported to JS but in
// Objective-C it stays private
// ABI49_0_0RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface ABI49_0_0RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)ABI49_0_0ReactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

- (void)setNeedsLayout;

@end

@interface ABI49_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands;

- (void)runSyncUIUpdatesWithObserver:(id<ABI49_0_0RCTUIManagerObserver>)observer;

@end

@interface ABI49_0_0ComponentUpdate : NSObject

@property (nonnull) NSMutableDictionary *props;
@property (nonnull) NSNumber *viewTag;
@property (nonnull) NSString *viewName;

@end

@implementation ABI49_0_0ComponentUpdate
@end

@implementation ABI49_0_0RCTUIManager (SyncUpdates)

- (BOOL)hasEnqueuedUICommands
{
  // Accessing some private bits of ABI49_0_0RCTUIManager to provide missing functionality
  return [[self valueForKey:@"_pendingUIBlocks"] count] > 0;
}

- (void)runSyncUIUpdatesWithObserver:(id<ABI49_0_0RCTUIManagerObserver>)observer
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
  NSHashTable<id<ABI49_0_0RCTUIManagerObserver>> *soleObserver = [NSHashTable new];
  [soleObserver addObject:observer];
  [self.observerCoordinator setValue:soleObserver forKey:@"_observers"];

  // run batch
  [self batchDidComplete];
  // restore old observers table
  [self.observerCoordinator setValue:oldObservers forKey:@"_observers"];
}

@end

#ifndef ABI49_0_0RCT_NEW_ARCH_ENABLED

@interface ABI49_0_0REASyncUpdateObserver : NSObject <ABI49_0_0RCTUIManagerObserver>
@end

@implementation ABI49_0_0REASyncUpdateObserver {
  volatile void (^_mounting)(void);
  volatile BOOL _waitTimedOut;
  dispatch_semaphore_t _semaphore;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _mounting = nil;
    _waitTimedOut = NO;
    _semaphore = dispatch_semaphore_create(0);
  }
  return self;
}

- (void)dealloc
{
  ABI49_0_0RCTAssert(_mounting == nil, @"Mouting block was set but never executed. This may lead to UI inconsistencies");
}

- (void)unblockUIThread
{
  ABI49_0_0RCTAssertUIManagerQueue();
  dispatch_semaphore_signal(_semaphore);
}

- (void)waitAndMountWithTimeout:(NSTimeInterval)timeout
{
  ABI49_0_0RCTAssertMainQueue();
  long result = dispatch_semaphore_wait(_semaphore, dispatch_time(DISPATCH_TIME_NOW, timeout * NSEC_PER_SEC));
  if (result != 0) {
    @synchronized(self) {
      _waitTimedOut = YES;
    }
  }
  if (_mounting) {
    _mounting();
    _mounting = nil;
  }
}

- (BOOL)uiManager:(ABI49_0_0RCTUIManager *)manager performMountingWithBlock:(ABI49_0_0RCTUIManagerMountingBlock)block
{
  ABI49_0_0RCTAssertUIManagerQueue();
  @synchronized(self) {
    if (_waitTimedOut) {
      return NO;
    } else {
      _mounting = block;
      return YES;
    }
  }
}

@end

#endif

@implementation ABI49_0_0REANodesManager {
  CADisplayLink *_displayLink;
  BOOL _wantRunUpdates;
  NSMutableArray<ABI49_0_0REAOnAnimationCallback> *_onAnimationCallbacks;
  BOOL _tryRunBatchUpdatesSynchronously;
  ABI49_0_0REAEventHandler _eventHandler;
  NSMutableDictionary<NSNumber *, ABI49_0_0ComponentUpdate *> *_componentUpdateBuffer;
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry;
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  __weak ABI49_0_0RCTBridge *_bridge;
  ABI49_0_0REAPerformOperations _performOperations;
  __weak id<ABI49_0_0RCTSurfacePresenterStub> _surfacePresenter;
  NSMutableDictionary<NSNumber *, NSMutableDictionary *> *_operationsInBatch;
#else
  NSMutableArray<ABI49_0_0REANativeAnimationOp> *_operationsInBatch;
  volatile atomic_bool _shouldFlushUpdateBuffer;
#endif
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (nonnull instancetype)initWithModule:(ABI49_0_0REAModule *)reanimatedModule
                                bridge:(ABI49_0_0RCTBridge *)bridge
                      surfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  if ((self = [super init])) {
    _bridge = bridge;
    _surfacePresenter = surfacePresenter;
    _reanimatedModule = reanimatedModule;
    _wantRunUpdates = NO;
    _onAnimationCallbacks = [NSMutableArray new];
    _operationsInBatch = [NSMutableDictionary new];
    _componentUpdateBuffer = [NSMutableDictionary new];
    _viewRegistry = [_uiManager valueForKey:@"_viewRegistry"];
  }

  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onAnimationFrame:)];
  _displayLink.preferredFramesPerSecond = 120; // will fallback to 60 fps for devices without Pro Motion display
  [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  [_displayLink setPaused:true];
  return self;
}
#else
- (instancetype)initWithModule:(ABI49_0_0REAModule *)reanimatedModule uiManager:(ABI49_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _reanimatedModule = reanimatedModule;
    _uiManager = uiManager;
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
#endif

- (void)invalidate
{
  _eventHandler = nil;
  [_displayLink invalidate];
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (void)setSurfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}
#endif

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

- (void)postOnAnimation:(ABI49_0_0REAOnAnimationCallback)clb
{
  [_onAnimationCallbacks addObject:clb];
  [self startUpdatingOnAnimationFrame];
}

- (void)registerEventHandler:(ABI49_0_0REAEventHandler)eventHandler
{
  _eventHandler = eventHandler;
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (void)registerPerformOperations:(ABI49_0_0REAPerformOperations)performOperations
{
  _performOperations = performOperations;
}
#endif

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

  NSArray<ABI49_0_0REAOnAnimationCallback> *callbacks = _onAnimationCallbacks;
  _onAnimationCallbacks = [NSMutableArray new];

  // When one of the callbacks would postOnAnimation callback we don't want
  // to process it until the next frame. This is why we cpy the array before
  // we iterate over it
  for (ABI49_0_0REAOnAnimationCallback block in callbacks) {
    block(displayLink);
  }

  [self performOperations];

  if (_onAnimationCallbacks.count == 0) {
    [self stopUpdatingOnAnimationFrame];
  }
}

- (void)performOperations
{
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  _performOperations(); // calls NativeReanimatedModule::performOperations
  _wantRunUpdates = NO;
#else
  if (_operationsInBatch.count != 0) {
    NSMutableArray<ABI49_0_0REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;

    __weak __typeof__(self) weakSelf = self;
    ABI49_0_0REASyncUpdateObserver *syncUpdateObserver = [ABI49_0_0REASyncUpdateObserver new];
    ABI49_0_0RCTExecuteOnUIManagerQueue(^{
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      BOOL canUpdateSynchronously = trySynchronously && ![strongSelf.uiManager hasEnqueuedUICommands];

      if (!canUpdateSynchronously) {
        [syncUpdateObserver unblockUIThread];
      }

      for (int i = 0; i < copiedOperationsQueue.count; i++) {
        copiedOperationsQueue[i](strongSelf.uiManager);
      }

      if (canUpdateSynchronously) {
        [strongSelf.uiManager runSyncUIUpdatesWithObserver:syncUpdateObserver];
        [syncUpdateObserver unblockUIThread];
      }
      // In case canUpdateSynchronously=true we still have to send uiManagerWillPerformMounting event
      // to observers because some components (e.g. TextInput) update their UIViews only on that event.
      [strongSelf.uiManager setNeedsLayout];
    });
    if (trySynchronously) {
      // The 16ms timeout here aims to match the frame duration. It may make sense to read that parameter
      // from CADisplayLink but it is easier to hardcode it for the time being.
      // The reason why we use frame duration here is that if takes longer than one frame to complete layout tasks
      // there is no point of synchronizing layout with the UI interaction as we get that one frame delay anyways.
      [syncUpdateObserver waitAndMountWithTimeout:0.016];
    }
  }
  _wantRunUpdates = NO;
#endif
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
// nothing
#else
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI49_0_0ReactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync
{
  if (trySync) {
    _tryRunBatchUpdatesSynchronously = YES;
  }
  [_operationsInBatch addObject:^(ABI49_0_0RCTUIManager *uiManager) {
    [uiManager updateView:ABI49_0_0ReactTag viewName:viewName props:nativeProps];
  }];
}
#endif

- (void)dispatchEvent:(id<ABI49_0_0RCTEvent>)event
{
  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, ABI49_0_0RCTNormalizeInputEventName(event.eventName)];

  NSString *eventHash = [NSString stringWithFormat:@"%@%@", event.viewTag, event.eventName];

  if (_eventHandler != nil) {
    __weak ABI49_0_0REAEventHandler eventHandler = _eventHandler;
    __weak __typeof__(self) weakSelf = self;
    ABI49_0_0RCTExecuteOnMainQueue(^void() {
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      if (eventHandler == nil) {
        return;
      }
      eventHandler(eventHash, event);
      [strongSelf performOperations];
    });
  }
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
// nothing
#else
- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet
{
  _uiProps = uiPropsSet;
  _nativeProps = nativePropsSet;
}
#endif

- (BOOL)isNativeViewMounted:(NSNumber *)viewTag
{
  UIView *view = _viewRegistry[viewTag];
  if (view.superview != nil) {
    return YES;
  }
#if __has_include(<ABI49_0_0RNScreens/ABI49_0_0RNSScreenStackHeaderConfig.h>)
  if ([view isKindOfClass:[ABI49_0_0RNSScreenStackHeaderConfig class]]) {
    return ((ABI49_0_0RNSScreenStackHeaderConfig *)view).screenView != nil;
  }
#endif
  return NO;
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)synchronouslyUpdateViewOnUIThread:(nonnull NSNumber *)viewTag props:(nonnull NSDictionary *)uiProps
{
  // adapted from ABI49_0_0RCTPropsAnimatedNode.m
  ABI49_0_0RCTSurfacePresenter *surfacePresenter = _bridge.surfacePresenter ?: _surfacePresenter;
  [surfacePresenter synchronouslyUpdateViewOnUIThread:viewTag props:uiProps];

  // `synchronouslyUpdateViewOnUIThread` does not flush props like `backgroundColor` etc.
  // so that's why we need to call `finalizeUpdates` here.
  ABI49_0_0RCTComponentViewRegistry *componentViewRegistry = surfacePresenter.mountingManager.componentViewRegistry;
  UIView<ABI49_0_0RCTComponentViewProtocol> *componentView =
      [componentViewRegistry findComponentViewWithTag:[viewTag integerValue]];
  [componentView finalizeUpdates:ABI49_0_0RNComponentViewUpdateMask{}];
}

#else

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName
{
  ABI49_0_0ComponentUpdate *lastSnapshot = _componentUpdateBuffer[viewTag];
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
      ABI49_0_0ComponentUpdate *propsSnapshot = [ABI49_0_0ComponentUpdate new];
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
  UIView *view = [self.uiManager viewForABI49_0_0ReactTag:viewTag];

  NSString *result =
      [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];

  if ([propName isEqualToString:@"opacity"]) {
    CGFloat alpha = view.alpha;
    result = [@(alpha) stringValue];
  } else if ([propName isEqualToString:@"zIndex"]) {
    NSInteger zIndex = view.ABI49_0_0ReactZIndex;
    result = [@(zIndex) stringValue];
  }

  return result;
}

- (void)maybeFlushUpdateBuffer
{
  ABI49_0_0RCTAssertUIManagerQueue();
  bool shouldFlushUpdateBuffer = atomic_load(&_shouldFlushUpdateBuffer);
  if (!shouldFlushUpdateBuffer) {
    return;
  }

  __weak __typeof__(self) weakSelf = self;
  [_uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    atomic_store(&strongSelf->_shouldFlushUpdateBuffer, false);
    NSMutableDictionary *componentUpdateBuffer = [strongSelf->_componentUpdateBuffer copy];
    strongSelf->_componentUpdateBuffer = [NSMutableDictionary new];
    for (NSNumber *tag in componentUpdateBuffer) {
      ABI49_0_0ComponentUpdate *componentUpdate = componentUpdateBuffer[tag];
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

#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

- (void)maybeFlushUIUpdatesQueue
{
  if ([_displayLink isPaused]) {
    [self performOperations];
  }
}

@end
