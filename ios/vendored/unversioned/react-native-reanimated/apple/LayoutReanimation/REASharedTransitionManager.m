#import <RNReanimated/REAFrame.h>
#import <RNReanimated/REAScreensHelper.h>
#import <RNReanimated/REASharedElement.h>
#import <RNReanimated/REASharedTransitionManager.h>
#import <RNReanimated/REAUtils.h>

@implementation REASharedTransitionManager {
  NSMutableDictionary<NSNumber *, REAUIView *> *_sharedTransitionParent;
  NSMutableDictionary<NSNumber *, NSNumber *> *_sharedTransitionInParentIndex;
  NSMutableDictionary<NSNumber *, REASnapshot *> *_snapshotRegistry;
  NSMutableDictionary<NSNumber *, REAUIView *> *_currentSharedTransitionViews;
  REAFindPrecedingViewTagForTransitionBlock _findPrecedingViewTagForTransition;
  REACancelAnimationBlock _cancelLayoutAnimation;
  REAUIView *_transitionContainer;
  NSMutableArray<REAUIView *> *_addedSharedViews;
  BOOL _isSharedTransitionActive;
  NSMutableArray<REASharedElement *> *_sharedElements;
  NSMutableDictionary<NSNumber *, REASharedElement *> *_sharedElementsLookup;
  REAAnimationsManager *_animationManager;
  NSMutableSet<NSNumber *> *_viewsToHide;
  NSMutableArray<REAUIView *> *_removedViews;
  NSMutableSet<REAUIView *> *_viewsWithCanceledAnimation;
  NSMutableDictionary<NSNumber *, NSNumber *> *_disableCleaningForView;
  NSMutableDictionary<NSNumber *, REAUIView *> *_removedViewRegistry;
  NSMutableSet<NSNumber *> *_layoutedSharedViewsTags;
  NSMutableDictionary<NSNumber *, REAFrame *> *_layoutedSharedViewsFrame;
  NSMutableSet<REAUIView *> *_reattachedViews;
  BOOL _isStackDropped;
  BOOL _isAsyncSharedTransitionConfigured;
  BOOL _isConfigured;
  BOOL _clearScreen;
}

/*
  `_sharedTransitionManager` provides access to current REASharedTransitionManager
  instance from swizzled methods in react-native-screens. Swizzled method has
  different context of execution (self != REASharedTransitionManager)
*/
static REASharedTransitionManager *_sharedTransitionManager;

- (instancetype)initWithAnimationsManager:(REAAnimationsManager *)animationManager
{
  if (self = [super init]) {
    _snapshotRegistry = [NSMutableDictionary new];
    _currentSharedTransitionViews = [NSMutableDictionary new];
    _addedSharedViews = [NSMutableArray new];
    _sharedTransitionParent = [NSMutableDictionary new];
    _sharedTransitionInParentIndex = [NSMutableDictionary new];
    _isSharedTransitionActive = NO;
    _sharedElements = [NSMutableArray new];
    _sharedElementsLookup = [NSMutableDictionary new];
    _animationManager = animationManager;
    _viewsToHide = [NSMutableSet new];
    _sharedTransitionManager = self;
    _disableCleaningForView = [NSMutableDictionary new];
    _removedViewRegistry = [NSMutableDictionary new];
    _layoutedSharedViewsTags = [NSMutableSet new];
    _layoutedSharedViewsFrame = [NSMutableDictionary new];
    _reattachedViews = [NSMutableSet new];
    _isAsyncSharedTransitionConfigured = NO;
    _isConfigured = NO;
    [self swizzleScreensMethods];
  }
  return self;
}

- (void)invalidate
{
  _snapshotRegistry = nil;
  _currentSharedTransitionViews = nil;
  _addedSharedViews = nil;
  _sharedTransitionParent = nil;
  _sharedTransitionInParentIndex = nil;
  _sharedElements = nil;
  _animationManager = nil;
}

- (REAUIView *)getTransitioningView:(NSNumber *)tag
{
  REAUIView *view = _currentSharedTransitionViews[tag];
  if (view == nil) {
    return _removedViewRegistry[tag];
  }
  return view;
}

- (void)notifyAboutNewView:(REAUIView *)view
{
  if (!_isConfigured) {
    return;
  }
  [_addedSharedViews addObject:view];
}

- (void)notifyAboutViewLayout:(REAUIView *)view withViewFrame:(CGRect)frame
{
  if (!_isConfigured) {
    return;
  }
  [_layoutedSharedViewsTags addObject:view.reactTag];
  float x = frame.origin.x;
  float y = frame.origin.y;
  float width = frame.size.width;
  float height = frame.size.height;
  _layoutedSharedViewsFrame[view.reactTag] = [[REAFrame alloc] initWithX:x y:y width:width height:height];
}

- (void)viewsDidLayout
{
  if (!_isConfigured) {
    return;
  }
  [self configureAsyncSharedTransitionForViews:_addedSharedViews];
  [_addedSharedViews removeAllObjects];
  [self maybeRestartAnimationWithNewLayout];
  [_layoutedSharedViewsTags removeAllObjects];
  [_layoutedSharedViewsFrame removeAllObjects];
}

- (void)configureAsyncSharedTransitionForViews:(NSArray<REAUIView *> *)views
{
  if ([views count] > 0) {
    NSArray *sharedViews = [self sortViewsByTags:views];
    _sharedElements = [self getSharedElementForCurrentTransition:sharedViews withNewElements:YES];
    [self resolveAnimationType:_sharedElements isInteractive:NO];
    _isAsyncSharedTransitionConfigured = YES;
  }
}

- (void)maybeRestartAnimationWithNewLayout
{
  if ([_layoutedSharedViewsTags count] == 0 || [_currentSharedTransitionViews count] == 0) {
    return;
  }
  NSMutableArray<REASharedElement *> *sharedElementToRestart = [NSMutableArray new];
  for (REASharedElement *sharedElement in _sharedElements) {
    NSNumber *viewTag = sharedElement.targetView.reactTag;
    if ([_layoutedSharedViewsTags containsObject:viewTag] && _currentSharedTransitionViews[viewTag]) {
      [sharedElementToRestart addObject:sharedElement];
    }
  }

  for (REASharedElement *sharedElement in sharedElementToRestart) {
    REAUIView *sourceView = sharedElement.sourceView;
    REAUIView *targetView = sharedElement.targetView;

    REASnapshot *newSourceViewSnapshot = [[REASnapshot alloc] initWithAbsolutePosition:sourceView];
    REASnapshot *currentTargetViewSnapshot = _snapshotRegistry[targetView.reactTag];
    REAFrame *frameData = _layoutedSharedViewsFrame[targetView.reactTag];
    float currentOriginX = [currentTargetViewSnapshot.values[@"originX"] floatValue];
    float currentOriginY = [currentTargetViewSnapshot.values[@"originY"] floatValue];
    float currentOriginXByParent = [currentTargetViewSnapshot.values[@"originXByParent"] floatValue];
    float currentOriginYByParent = [currentTargetViewSnapshot.values[@"originYByParent"] floatValue];
    NSNumber *newOriginX = @(currentOriginX - currentOriginXByParent + frameData.x);
    NSNumber *newOriginY = @(currentOriginY - currentOriginYByParent + frameData.y);
    currentTargetViewSnapshot.values[@"width"] = @(frameData.width);
    currentTargetViewSnapshot.values[@"height"] = @(frameData.height);
    currentTargetViewSnapshot.values[@"originX"] = newOriginX;
    currentTargetViewSnapshot.values[@"originY"] = newOriginY;
    currentTargetViewSnapshot.values[@"globalOriginX"] = newOriginX;
    currentTargetViewSnapshot.values[@"globalOriginY"] = newOriginY;
    currentTargetViewSnapshot.values[@"originXByParent"] = @(frameData.x);
    currentTargetViewSnapshot.values[@"originYByParent"] = @(frameData.y);
    sharedElement.sourceViewSnapshot = newSourceViewSnapshot;

    [self disableCleaningForViewTag:sourceView.reactTag];
    [self disableCleaningForViewTag:targetView.reactTag];
  }
  [self startSharedTransition:sharedElementToRestart];
}

- (BOOL)configureAndStartSharedTransitionForViews:(NSArray<REAUIView *> *)views isInteractive:(BOOL)isInteractive
{
  NSArray *sharedViews = [self sortViewsByTags:views];
  NSArray<REASharedElement *> *sharedElements = [self getSharedElementForCurrentTransition:sharedViews
                                                                           withNewElements:NO];
  if ([sharedElements count] == 0) {
    return NO;
  }
  [self resolveAnimationType:sharedElements isInteractive:isInteractive];
  [self configureTransitionContainer];
  [self reparentSharedViewsForCurrentTransition:sharedElements];
  [self startSharedTransition:sharedElements];
  return YES;
}

- (NSArray *)sortViewsByTags:(NSArray *)views
{
  /*
    All shared views during the transition have the same parent. It is problematic if parent
    view and their children are in the same transition. To keep the valid order in the z-axis,
    we need to sort views by tags. Parent tag is lower than children tags.
  */
  return [views sortedArrayUsingComparator:^NSComparisonResult(REAUIView *view1, REAUIView *view2) {
    return [view2.reactTag compare:view1.reactTag];
  }];
}

- (NSMutableArray<REASharedElement *> *)getSharedElementForCurrentTransition:(NSArray *)sharedViews
                                                             withNewElements:(BOOL)addedNewScreen
{
  NSMutableArray<REAUIView *> *newTransitionViews = [NSMutableArray new];
  NSMutableArray<REASharedElement *> *newSharedElements = [NSMutableArray new];
  NSMutableSet<NSNumber *> *currentSharedViewsTags = [NSMutableSet new];
  for (REAUIView *sharedView in sharedViews) {
    [currentSharedViewsTags addObject:sharedView.reactTag];
  }
  for (REAUIView *sharedView in sharedViews) {
    // add observers
    REAUIView *sharedViewScreen = [REAScreensHelper getScreenForView:sharedView];
    REAUIView *stack = [REAScreensHelper getStackForView:sharedViewScreen];

    // find sibling for shared view
    NSNumber *siblingViewTag = _findPrecedingViewTagForTransition(sharedView.reactTag);
    REAUIView *siblingView = nil;
    do {
      siblingView = [_animationManager viewForTag:siblingViewTag];
      if (siblingView == nil) {
        [self clearAllSharedConfigsForViewTag:siblingViewTag];
        siblingViewTag = _findPrecedingViewTagForTransition(sharedView.reactTag);
      }
    } while (siblingView == nil && siblingViewTag != nil);

    if (siblingView == nil) {
      // the sibling of shared view doesn't exist yet
      continue;
    }

    REAUIView *viewSource;
    REAUIView *viewTarget;
    if (addedNewScreen) {
      viewSource = siblingView;
      viewTarget = sharedView;
    } else {
      viewSource = sharedView;
      viewTarget = siblingView;
    }

    bool isInCurrentTransition = false;
    if (_currentSharedTransitionViews[viewSource.reactTag] || _currentSharedTransitionViews[viewTarget.reactTag]) {
      isInCurrentTransition = true;
      if (addedNewScreen) {
        siblingViewTag = _findPrecedingViewTagForTransition(siblingView.reactTag);
        siblingView = [_animationManager viewForTag:siblingViewTag];

        viewSource = siblingView;
        viewTarget = sharedView;
      }
    }

    if ([currentSharedViewsTags containsObject:viewSource.reactTag] &&
        [currentSharedViewsTags containsObject:viewTarget.reactTag]) {
      continue;
    }

    bool isModal = [REAScreensHelper isScreenModal:sharedViewScreen];
    // check valid target screen configuration
    int screensCount = [stack.reactSubviews count];
    if (addedNewScreen && !isModal) {
      // is under top
      if (screensCount < 2) {
        continue;
      }
      REAUIView *viewSourceParentScreen = [REAScreensHelper getScreenForView:viewSource];
      REAUIView *screenUnderStackTop = stack.reactSubviews[screensCount - 2];
      if (![screenUnderStackTop.reactTag isEqual:viewSourceParentScreen.reactTag] && !isInCurrentTransition) {
        continue;
      }
    } else if (!addedNewScreen) {
      // is on top
      REAUIView *viewTargetParentScreen = [REAScreensHelper getScreenForView:viewTarget];
      // TODO macOS navigationController isn't available on macOS
#if !TARGET_OS_OSX
      REAUIView *stackTarget = viewTargetParentScreen.reactViewController.navigationController.topViewController.view;
      if (stackTarget != viewTargetParentScreen) {
        continue;
      }
#endif
    }

    if (isModal) {
      [_viewsToHide addObject:viewSource.reactTag];
    }

    REASnapshot *sourceViewSnapshot = [[REASnapshot alloc] initWithAbsolutePosition:viewSource];
    if (addedNewScreen && !_currentSharedTransitionViews[viewSource.reactTag]) {
      _snapshotRegistry[viewSource.reactTag] = sourceViewSnapshot;
    }

    REASnapshot *targetViewSnapshot;
    if (addedNewScreen) {
      targetViewSnapshot = [[REASnapshot alloc] initWithAbsolutePosition:viewTarget];
      _snapshotRegistry[viewTarget.reactTag] = targetViewSnapshot;
    } else {
      targetViewSnapshot = _snapshotRegistry[viewTarget.reactTag];
      if (targetViewSnapshot == nil) {
        targetViewSnapshot = [[REASnapshot alloc] initWithAbsolutePosition:viewTarget];
      }
    }

    [newTransitionViews addObject:viewSource];
    [newTransitionViews addObject:viewTarget];

    REASharedElement *sharedElement = [[REASharedElement alloc] initWithSourceView:viewSource
                                                                sourceViewSnapshot:sourceViewSnapshot
                                                                        targetView:viewTarget
                                                                targetViewSnapshot:targetViewSnapshot];
    [newSharedElements addObject:sharedElement];
  }
  if ([newTransitionViews count] > 0) {
    NSMutableArray *currentSourceViews = [NSMutableArray new];
    for (REASharedElement *sharedElement in _sharedElements) {
      [currentSourceViews addObject:sharedElement.sourceView];
    }
    NSMutableSet *newSourceViews = [NSMutableSet new];
    for (REASharedElement *sharedElement in newSharedElements) {
      [newSourceViews addObject:sharedElement.sourceView];
    }
    for (REAUIView *view in currentSourceViews) {
      if (![newSourceViews containsObject:view]) {
        _removedViewRegistry[view.reactTag] = view;
      }
    }
    [_currentSharedTransitionViews removeAllObjects];
    for (REAUIView *view in newTransitionViews) {
      _currentSharedTransitionViews[view.reactTag] = view;
    }
  }
  if ([newSharedElements count] != 0) {
    _sharedElements = newSharedElements;
    for (REASharedElement *sharedElement in newSharedElements) {
      _sharedElementsLookup[sharedElement.sourceView.reactTag] = sharedElement;
    }
  }
  return newSharedElements;
}

/*
  Method swizzling is used to get notification from react-native-screens
  about push or pop screen from stack.
*/
- (void)swizzleScreensMethods
{
#if LOAD_SCREENS_HEADERS
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL viewDidLayoutSubviewsSelector = @selector(viewDidLayoutSubviews);
    SEL notifyWillDisappearSelector = @selector(notifyWillDisappear);
    Class screenClass = [RNSScreen class];
    Class screenViewClass = [RNSScreenView class];
    BOOL allSelectorsAreAvailable = [RNSScreen instancesRespondToSelector:viewDidLayoutSubviewsSelector] &&
        [RNSScreenView instancesRespondToSelector:notifyWillDisappearSelector] &&
        [RNSScreenView instancesRespondToSelector:@selector(isModal)]; // used by REAScreenHelper

    if (allSelectorsAreAvailable) {
      [REAUtils swizzleMethod:viewDidLayoutSubviewsSelector
                     forClass:screenClass
                         with:@selector(reanimated_viewDidLayoutSubviews)
                    fromClass:[self class]];
      [REAUtils swizzleMethod:notifyWillDisappearSelector
                     forClass:screenViewClass
                         with:@selector(reanimated_notifyWillDisappear)
                    fromClass:[self class]];
      _isConfigured = YES;
    }
  });
#endif
}

- (void)reanimated_viewDidLayoutSubviews
{
  // call original method from react-native-screens, self == RNScreen
  [self reanimated_viewDidLayoutSubviews];
  REAUIView *screen = [self valueForKey:@"screenView"];
  [_sharedTransitionManager screenAddedToStack:screen];
}

- (void)reanimated_notifyWillDisappear
{
  // call original method from react-native-screens, self == RNSScreenView
  [self reanimated_notifyWillDisappear];
  [_sharedTransitionManager screenRemovedFromStack:(REAUIView *)self];
}

- (void)screenAddedToStack:(REAUIView *)screen
{
  if (screen.superview != nil) {
    [self runAsyncSharedTransition];
  }
}

- (void)screenRemovedFromStack:(REAUIView *)screen
{
  _isStackDropped = NO;
  REAUIView *stack = [REAScreensHelper getStackForView:screen];
  bool isModal = [REAScreensHelper isScreenModal:screen];
  bool isRemovedInParentStack = [self isRemovedFromHigherStack:screen];
  if ((stack != nil || isModal) && !isRemovedInParentStack) {
    bool isInteractive = [self isInteractiveScreenChange:screen];
    // screen is removed from React tree (navigation.navigate(<screenName>))
    bool isScreenRemovedFromReactTree = [self isScreen:screen outsideStack:stack];
    // click on button goBack on native header
    bool isTriggeredByGoBackButton = [self isScreen:screen onTopOfStack:stack];
    bool shouldRunTransition = (isScreenRemovedFromReactTree || isTriggeredByGoBackButton) &&
        !(isInteractive && [_currentSharedTransitionViews count] > 0);
    if (shouldRunTransition) {
      [self runSharedTransitionForSharedViewsOnScreen:screen isInteractive:isInteractive];
    } else {
      [self makeSnapshotForScreenViews:screen];
    }
  } else {
    // removed stack
    if (![self isInteractiveScreenChange:screen]) {
      [self clearConfigForStackNow:stack];
    } else {
      _isStackDropped = YES;
    }
  }
}

- (bool)isInteractiveScreenChange:(REAUIView *)screen
{
#if !TARGET_OS_OSX
  return screen.reactViewController.transitionCoordinator.interactive;
#else
  // TODO macOS transitionCoordinator isn't available on macOS
  return false;
#endif
}

- (void)makeSnapshotForScreenViews:(REAUIView *)screen
{
  REANodeFind(screen, ^int(id<RCTComponent> view) {
    NSNumber *viewTag = view.reactTag;
    if (self->_currentSharedTransitionViews[viewTag]) {
      return false;
    }
    if ([self->_animationManager hasAnimationForTag:viewTag type:SHARED_ELEMENT_TRANSITION]) {
      REASnapshot *snapshot = [[REASnapshot alloc] initWithAbsolutePosition:(REAUIView *)view];
      self->_snapshotRegistry[viewTag] = snapshot;
    }
    return false;
  });
}

- (void)clearConfigForStackNow:(REAUIView *)stack
{
  for (REAUIView *screen in stack.reactSubviews) {
    [self clearConfigForScreen:screen];
  }
}

- (BOOL)isScreen:(REAUIView *)screen outsideStack:(REAUIView *)stack
{
  for (REAUIView *child in stack.reactSubviews) {
    if ([child.reactTag isEqual:screen.reactTag]) {
      return NO;
    }
  }
  return YES;
}

- (BOOL)isScreen:(REAUIView *)screen onTopOfStack:(REAUIView *)stack
{
  int screenCount = stack.reactSubviews.count;
  return screenCount > 0 && screen == stack.reactSubviews.lastObject;
}

- (BOOL)isRemovedFromHigherStack:(REAUIView *)screen
{
  REAUIView *stack = screen.reactSuperview;
  while (stack != nil) {
#if !TARGET_OS_OSX
    screen = stack.reactViewController.navigationController.topViewController.view;
#else
    // TODO macOS navigationController isn't available on macOS
    screen = nil;
#endif
    if (screen == nil) {
      break;
    }
    if (screen.superview == nil) {
      return YES;
    }
    stack = screen.reactSuperview;
  }
  return NO;
}

- (void)runSharedTransitionForSharedViewsOnScreen:(REAUIView *)screen isInteractive:(BOOL)isInteractive
{
  NSMutableArray<REAUIView *> *removedViews = [NSMutableArray new];
  REANodeFind(screen, ^int(id<RCTComponent> view) {
    if ([self->_animationManager hasAnimationForTag:view.reactTag type:SHARED_ELEMENT_TRANSITION]) {
      [removedViews addObject:(REAUIView *)view];
    }
    return false;
  });
  BOOL startedAnimation = [self configureAndStartSharedTransitionForViews:removedViews isInteractive:isInteractive];
  if (startedAnimation) {
    _removedViews = removedViews;
  } else if (![self isInteractiveScreenChange:screen]) {
    [self clearConfigForScreen:screen];
  } else {
    _clearScreen = YES;
  }
}

- (void)runAsyncSharedTransition
{
  if ([_sharedElements count] == 0 || !_isAsyncSharedTransitionConfigured) {
    return;
  }
  for (REASharedElement *sharedElement in _sharedElements) {
    REAUIView *viewTarget = sharedElement.targetView;
    REASnapshot *targetViewSnapshot = [[REASnapshot alloc] initWithAbsolutePosition:viewTarget];
    _snapshotRegistry[viewTarget.reactTag] = targetViewSnapshot;
    sharedElement.targetViewSnapshot = targetViewSnapshot;
  }

  [self configureTransitionContainer];
  [self reparentSharedViewsForCurrentTransition:_sharedElements];
  [self startSharedTransition:_sharedElements];
  [_addedSharedViews removeAllObjects];
  _isAsyncSharedTransitionConfigured = NO;
}

- (void)configureTransitionContainer
{
  if (!_isSharedTransitionActive) {
    _isSharedTransitionActive = YES;
    REAUIView *mainWindow = UIApplication.sharedApplication.keyWindow;
    if (_transitionContainer == nil) {
      _transitionContainer = [REAUIView new];
    }
    [mainWindow addSubview:_transitionContainer];
    // TODO macOS bringSubviewToFront isn't available on macOS
#if !TARGET_OS_OSX
    [mainWindow bringSubviewToFront:_transitionContainer];
#endif
  }
}

- (void)reparentSharedViewsForCurrentTransition:(NSArray *)sharedElements
{
  for (REASharedElement *sharedElement in sharedElements) {
    REAUIView *viewSource = sharedElement.sourceView;
    [_reattachedViews addObject:viewSource];
    if (_sharedTransitionParent[viewSource.reactTag] == nil) {
      _sharedTransitionParent[viewSource.reactTag] = viewSource.superview;
      _sharedTransitionInParentIndex[viewSource.reactTag] = @([viewSource.superview.subviews indexOfObject:viewSource]);
      [viewSource removeFromSuperview];
      [_transitionContainer addSubview:viewSource];
    }
  }
}

- (void)startSharedTransition:(NSArray *)sharedElements
{
  for (REASharedElement *sharedElement in sharedElements) {
    sharedElement.targetView.hidden = YES;
    LayoutAnimationType type = sharedElement.animationType;
    [self onViewTransition:sharedElement.sourceView
                    before:sharedElement.sourceViewSnapshot
                     after:sharedElement.targetViewSnapshot
                      type:type];
  }
}

- (void)onViewTransition:(REAUIView *)view
                  before:(REASnapshot *)before
                   after:(REASnapshot *)after
                    type:(LayoutAnimationType)type
{
  NSMutableDictionary *targetValues = after.values;
  NSMutableDictionary *currentValues = before.values;
  // TODO macOS bringSubviewToFront isn't available on macOS
#if !TARGET_OS_OSX
  [view.superview bringSubviewToFront:view];
#endif
  NSDictionary *preparedValues = [self prepareDataForWorklet:currentValues targetValues:targetValues];
  [_animationManager startAnimationForTag:view.reactTag type:type yogaValues:preparedValues];
}

- (void)finishSharedAnimation:(REAUIView *)view removeView:(BOOL)removeView
{
  if (!_isConfigured) {
    return;
  }
  NSNumber *viewTag = view.reactTag;
  if (_disableCleaningForView[viewTag]) {
    [self enableCleaningForViewTag:viewTag];
    return;
  }
  REASharedElement *sharedElement = _sharedElementsLookup[viewTag];
  if (sharedElement == nil) {
    return;
  }
  [_sharedElementsLookup removeObjectForKey:viewTag];
  if ([_reattachedViews containsObject:view]) {
    [_reattachedViews removeObject:view];
    [view removeFromSuperview];
    REAUIView *parent = _sharedTransitionParent[viewTag];
    int childIndex = [_sharedTransitionInParentIndex[viewTag] intValue];
    REAUIView *screen = [REAScreensHelper getScreenForView:parent];
    bool isScreenInReactTree = screen.reactSuperview != nil;
    if (isScreenInReactTree) {
      [parent insertSubview:view atIndex:childIndex];
      REASnapshot *viewSourcePreviousSnapshot = _snapshotRegistry[viewTag];
      [_animationManager progressLayoutAnimationWithStyle:viewSourcePreviousSnapshot.values
                                                   forTag:viewTag
                                       isSharedTransition:YES];
      float originXByParent = [viewSourcePreviousSnapshot.values[@"originXByParent"] floatValue];
      float originYByParent = [viewSourcePreviousSnapshot.values[@"originYByParent"] floatValue];
      CGRect frame = CGRectMake(originXByParent, originYByParent, view.frame.size.width, view.frame.size.height);
      [view setFrame:frame];
    }
    [_sharedTransitionParent removeObjectForKey:viewTag];
    [_sharedTransitionInParentIndex removeObjectForKey:viewTag];
  }

  REAUIView *targetView = sharedElement.targetView;
  targetView.hidden = NO;
  if ([_viewsToHide containsObject:viewTag]) {
    view.hidden = YES;
  }
  if (!removeView) {
    [_removedViews removeObject:view];
  }
  if ([_removedViews containsObject:view]) {
    [_animationManager clearAnimationConfigForTag:viewTag];
  }
  if (_removedViewRegistry[view.reactTag]) {
    return;
  }
  if ([_reattachedViews count] == 0) {
    [_transitionContainer removeFromSuperview];
    [_removedViewRegistry removeAllObjects];
    [_currentSharedTransitionViews removeAllObjects];
    [_removedViews removeAllObjects];
    [_sharedElements removeAllObjects];
    [_sharedElementsLookup removeAllObjects];
    [_viewsToHide removeAllObjects];
    _isSharedTransitionActive = NO;
  }
}

- (void)setFindPrecedingViewTagForTransitionBlock:
    (REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition
{
  _findPrecedingViewTagForTransition = findPrecedingViewTagForTransition;
}

- (void)setCancelAnimationBlock:(REACancelAnimationBlock)cancelAnimationBlock
{
  _cancelLayoutAnimation = cancelAnimationBlock;
}

- (void)clearAllSharedConfigsForViewTag:(NSNumber *)viewTag
{
  if (viewTag != nil) {
    [_snapshotRegistry removeObjectForKey:viewTag];
    [_animationManager clearAnimationConfigForTag:viewTag];
  }
}

- (void)cancelAnimation:(NSNumber *)viewTag
{
  _cancelLayoutAnimation(viewTag);
}

- (void)disableCleaningForViewTag:(NSNumber *)viewTag
{
  NSNumber *counter = _disableCleaningForView[viewTag];
  if (counter != nil) {
    _disableCleaningForView[viewTag] = @([counter intValue] + 1);
  } else {
    _disableCleaningForView[viewTag] = @(1);
  }
}

- (void)enableCleaningForViewTag:(NSNumber *)viewTag
{
  NSNumber *counter = _disableCleaningForView[viewTag];
  if (counter == nil) {
    return;
  }
  int counterInt = [counter intValue];
  if (counterInt == 1) {
    [_disableCleaningForView removeObjectForKey:viewTag];
  } else {
    _disableCleaningForView[viewTag] = @(counterInt - 1);
  }
}

- (void)resolveAnimationType:(NSArray<REASharedElement *> *)sharedElements isInteractive:(BOOL)isInteractive
{
  for (REASharedElement *sharedElement in sharedElements) {
    NSNumber *viewTag = sharedElement.sourceView.reactTag;
    bool viewHasProgressAnimation = [self->_animationManager hasAnimationForTag:viewTag
                                                                           type:SHARED_ELEMENT_TRANSITION_PROGRESS];
    if (viewHasProgressAnimation || isInteractive) {
      sharedElement.animationType = SHARED_ELEMENT_TRANSITION_PROGRESS;
    } else {
      sharedElement.animationType = SHARED_ELEMENT_TRANSITION;
    }
  }
}

- (NSDictionary *)prepareDataForWorklet:(NSMutableDictionary *)currentValues
                           targetValues:(NSMutableDictionary *)targetValues
{
  NSMutableDictionary *workletValues = [_animationManager prepareDataForLayoutAnimatingWorklet:currentValues
                                                                                  targetValues:targetValues];
  workletValues[@"currentTransformMatrix"] = currentValues[@"transformMatrix"];
  workletValues[@"targetTransformMatrix"] = targetValues[@"transformMatrix"];
  workletValues[@"currentBorderRadius"] = currentValues[@"borderRadius"];
  workletValues[@"targetBorderRadius"] = targetValues[@"borderRadius"];
  return workletValues;
}

- (void)onScreenRemoval:(REAUIView *)screen stack:(REAUIView *)stack
{
  if (_isStackDropped && screen != nil) {
    // to clear config from stack after swipe back
    [self clearConfigForStackNow:stack];
    _isStackDropped = NO;
  } else if (_clearScreen) {
    // to clear config from screen after swipe back
    [self clearConfigForScreen:screen];
    _clearScreen = NO;
  }
}

- (void)clearConfigForScreen:(REAUIView *)screen
{
  REANodeFind(screen, ^int(id<RCTComponent> _Nonnull view) {
    [self clearAllSharedConfigsForViewTag:view.reactTag];
    return false;
  });
}

@end
