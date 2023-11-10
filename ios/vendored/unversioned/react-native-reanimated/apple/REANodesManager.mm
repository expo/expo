#import <RNReanimated/READisplayLink.h>
#import <RNReanimated/REAModule.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REAUIKit.h>
#import <React/RCTConvert.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTMountingManager.h>
#import <React/RCTSurfacePresenter.h>
#import <react/renderer/core/ShadowNode.h>
#import <react/renderer/uimanager/UIManager.h>
#else
#import <stdatomic.h>
#endif

#if __has_include(<RNScreens/RNSScreenStackHeaderConfig.h>)
#import <RNScreens/RNSScreenStackHeaderConfig.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;
#endif

// Interface below has been added in order to use private methods of RCTUIManager,
// RCTUIManager#UpdateView is a React Method which is exported to JS but in
// Objective-C it stays private
// RCTUIManager#setNeedsLayout is a method which updated layout only which
// in its turn will trigger relayout if no batch has been activated

@interface RCTUIManager ()

- (void)updateView:(nonnull NSNumber *)reactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

- (void)setNeedsLayout;

- (bool)isExecutingUpdatesBatch;

@end

@interface RCTUIManager (SyncUpdates)

- (void)runSyncUIUpdatesWithObserver:(id<RCTUIManagerObserver>)observer;

@end

@interface ComponentUpdate : NSObject

@property (nonnull) NSMutableDictionary *props;
@property (nonnull) NSNumber *viewTag;
@property (nonnull) NSString *viewName;

@end

@implementation ComponentUpdate
@end

@implementation RCTUIManager (SyncUpdates)

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

#ifndef RCT_NEW_ARCH_ENABLED

@interface REASyncUpdateObserver : NSObject <RCTUIManagerObserver>
@end

@implementation REASyncUpdateObserver {
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
  RCTAssert(_mounting == nil, @"Mouting block was set but never executed. This may lead to UI inconsistencies");
}

- (void)unblockUIThread
{
  RCTAssertUIManagerQueue();
  dispatch_semaphore_signal(_semaphore);
}

- (void)waitAndMountWithTimeout:(NSTimeInterval)timeout
{
  RCTAssertMainQueue();
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

- (BOOL)uiManager:(RCTUIManager *)manager performMountingWithBlock:(RCTUIManagerMountingBlock)block
{
  RCTAssertUIManagerQueue();
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

@implementation REANodesManager {
  READisplayLink *_displayLink;
  BOOL _wantRunUpdates;
  NSMutableArray<REAOnAnimationCallback> *_onAnimationCallbacks;
  BOOL _tryRunBatchUpdatesSynchronously;
  REAEventHandler _eventHandler;
  NSMutableDictionary<NSNumber *, ComponentUpdate *> *_componentUpdateBuffer;
  NSMutableDictionary<NSNumber *, REAUIView *> *_viewRegistry;
#ifdef RCT_NEW_ARCH_ENABLED
  __weak RCTBridge *_bridge;
  REAPerformOperations _performOperations;
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
  NSMutableDictionary<NSNumber *, NSMutableDictionary *> *_operationsInBatch;
#else
  NSMutableArray<REANativeAnimationOp> *_operationsInBatch;
  volatile atomic_bool _shouldFlushUpdateBuffer;
#endif
}

- (READisplayLink *)getDisplayLink
{
  RCTAssertMainQueue();

  if (!_displayLink) {
    _displayLink = [READisplayLink displayLinkWithTarget:self selector:@selector(onAnimationFrame:)];
#if !TARGET_OS_OSX
    _displayLink.preferredFramesPerSecond = 120; // will fallback to 60 fps for devices without Pro Motion display
#endif
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
  return _displayLink;
}

- (void)useDisplayLinkOnMainQueue:(CADisplayLinkOperation)displayLinkOperation
{
  __weak __typeof__(self) weakSelf = self;
  RCTExecuteOnMainQueue(^{
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    displayLinkOperation([strongSelf getDisplayLink]);
  });
}

#ifdef RCT_NEW_ARCH_ENABLED
- (nonnull instancetype)initWithModule:(REAModule *)reanimatedModule
                                bridge:(RCTBridge *)bridge
                      surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
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
    _eventHandler = ^(id<RCTEvent> event) {
      // no-op
    };
  }
#else
- (instancetype)initWithModule:(REAModule *)reanimatedModule uiManager:(RCTUIManager *)uiManager
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
#endif
  [self useDisplayLinkOnMainQueue:^(READisplayLink *displayLink) {
    [displayLink setPaused:YES];
  }];

  return self;
}

- (void)invalidate
{
  _eventHandler = nil;
  [self useDisplayLinkOnMainQueue:^(READisplayLink *displayLink) {
    [displayLink invalidate];
  }];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}
#endif

- (void)operationsBatchDidComplete
{
  if (![[self getDisplayLink] isPaused]) {
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

- (void)postOnAnimation:(REAOnAnimationCallback)clb
{
  [_onAnimationCallbacks addObject:clb];
  [self startUpdatingOnAnimationFrame];
}

- (void)registerEventHandler:(REAEventHandler)eventHandler
{
  _eventHandler = eventHandler;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (void)registerPerformOperations:(REAPerformOperations)performOperations
{
  _performOperations = performOperations;
}
#endif

- (void)startUpdatingOnAnimationFrame
{
  [[self getDisplayLink] setPaused:NO];
}

- (void)stopUpdatingOnAnimationFrame
{
  [[self getDisplayLink] setPaused:YES];
}

- (void)onAnimationFrame:(READisplayLink *)displayLink
{
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
#ifdef RCT_NEW_ARCH_ENABLED
  _performOperations(); // calls NativeReanimatedModule::performOperations
  _wantRunUpdates = NO;
#else
  if (_operationsInBatch.count != 0) {
    NSMutableArray<REANativeAnimationOp> *copiedOperationsQueue = _operationsInBatch;
    _operationsInBatch = [NSMutableArray new];

    BOOL trySynchronously = _tryRunBatchUpdatesSynchronously;
    _tryRunBatchUpdatesSynchronously = NO;

    __weak __typeof__(self) weakSelf = self;
    REASyncUpdateObserver *syncUpdateObserver = [REASyncUpdateObserver new];
    RCTExecuteOnUIManagerQueue(^{
      __typeof__(self) strongSelf = weakSelf;
      if (strongSelf == nil) {
        return;
      }
      // It is safe to call `isExecutingUpdatesBatch` in this context (Shadow thread) because both
      // the Shadow thread and UI Thread are locked at this point. The UI Thread is specifically
      // locked by the lock inside `REASyncUpdateObserver`, ensuring a safe reading operation.
      BOOL canUpdateSynchronously = trySynchronously && ![strongSelf.uiManager isExecutingUpdatesBatch];

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

#ifdef RCT_NEW_ARCH_ENABLED
// nothing
#else
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
#endif

- (void)dispatchEvent:(id<RCTEvent>)event
{
  __weak REAEventHandler eventHandler = _eventHandler;
  __weak __typeof__(self) weakSelf = self;
  RCTExecuteOnMainQueue(^void() {
    __typeof__(self) strongSelf = weakSelf;
    if (strongSelf == nil) {
      return;
    }
    if (eventHandler == nil) {
      return;
    }
    eventHandler(event);
    [strongSelf performOperations];
  });
}

#ifdef RCT_NEW_ARCH_ENABLED
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
  REAUIView *view = _viewRegistry[viewTag];
  if (view.superview != nil) {
    return YES;
  }
#if __has_include(<RNScreens/RNSScreenStackHeaderConfig.h>)
  if ([view isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
    return ((RNSScreenStackHeaderConfig *)view).screenView != nil;
  }
#endif
  return NO;
}

#ifdef RCT_NEW_ARCH_ENABLED

- (void)synchronouslyUpdateViewOnUIThread:(nonnull NSNumber *)viewTag props:(nonnull NSDictionary *)uiProps
{
  // adapted from RCTPropsAnimatedNode.m
  RCTSurfacePresenter *surfacePresenter = _bridge.surfacePresenter ?: _surfacePresenter;
  RCTComponentViewRegistry *componentViewRegistry = surfacePresenter.mountingManager.componentViewRegistry;
  REAUIView<RCTComponentViewProtocol> *componentView =
      [componentViewRegistry findComponentViewWithTag:[viewTag integerValue]];

  NSSet<NSString *> *propKeysManagedByAnimated = [componentView propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN];
  [surfacePresenter synchronouslyUpdateViewOnUIThread:viewTag props:uiProps];
  [componentView setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:propKeysManagedByAnimated];

  // `synchronouslyUpdateViewOnUIThread` does not flush props like `backgroundColor` etc.
  // so that's why we need to call `finalizeUpdates` here.
  [componentView finalizeUpdates:RNComponentViewUpdateMask{}];
}

#else

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName
{
  ComponentUpdate *lastSnapshot = _componentUpdateBuffer[viewTag];
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
      ComponentUpdate *propsSnapshot = [ComponentUpdate new];
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
  REAUIView *view = [self.uiManager viewForReactTag:viewTag];

  NSString *result =
      [NSString stringWithFormat:@"error: unknown propName %@, currently supported: opacity, zIndex", propName];

  if ([propName isEqualToString:@"opacity"]) {
#if !TARGET_OS_OSX
    CGFloat alpha = view.alpha;
#else
    CGFloat alpha = view.alphaValue;
#endif
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

  __weak __typeof__(self) weakSelf = self;
  [_uiManager
      addUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, REAUIView *> *viewRegistry) {
        __typeof__(self) strongSelf = weakSelf;
        if (strongSelf == nil) {
          return;
        }
        atomic_store(&strongSelf->_shouldFlushUpdateBuffer, false);
        NSMutableDictionary *componentUpdateBuffer = [strongSelf->_componentUpdateBuffer copy];
        strongSelf->_componentUpdateBuffer = [NSMutableDictionary new];
        for (NSNumber *tag in componentUpdateBuffer) {
          ComponentUpdate *componentUpdate = componentUpdateBuffer[tag];
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

#endif // RCT_NEW_ARCH_ENABLED

- (void)maybeFlushUIUpdatesQueue
{
  if ([[self getDisplayLink] isPaused]) {
    [self performOperations];
  }
}

@end
