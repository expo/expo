#import <ABI49_0_0RNReanimated/ABI49_0_0REAFrame.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAScreensHelper.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REASharedElement.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REASharedTransitionManager.h>
#import <objc/runtime.h>

@implementation ABI49_0_0REASharedTransitionManager {
  NSMutableDictionary<NSNumber *, UIView *> *_sharedTransitionParent;
  NSMutableDictionary<NSNumber *, NSNumber *> *_sharedTransitionInParentIndex;
  NSMutableDictionary<NSNumber *, ABI49_0_0REASnapshot *> *_snapshotRegistry;
  NSMutableDictionary<NSNumber *, UIView *> *_currentSharedTransitionViews;
  ABI49_0_0REAFindPrecedingViewTagForTransitionBlock _findPrecedingViewTagForTransition;
  ABI49_0_0REACancelAnimationBlock _cancelLayoutAnimation;
  UIView *_transitionContainer;
  NSMutableArray<UIView *> *_addedSharedViews;
  BOOL _isSharedTransitionActive;
  NSMutableArray<ABI49_0_0REASharedElement *> *_sharedElements;
  ABI49_0_0REAAnimationsManager *_animationManager;
  NSMutableSet<NSNumber *> *_viewsToHide;
  NSMutableArray<UIView *> *_removedViews;
  NSMutableSet<UIView *> *_viewsWithCanceledAnimation;
  NSMutableDictionary<NSNumber *, NSNumber *> *_disableCleaningForView;
  NSMutableSet<NSNumber *> *_layoutedSharedViewsTags;
  NSMutableDictionary<NSNumber *, ABI49_0_0REAFrame *> *_layoutedSharedViewsFrame;
  BOOL _isAsyncSharedTransitionConfigured;
}

/*
  `_sharedTransitionManager` provides access to current ABI49_0_0REASharedTransitionManager
  instance from swizzled methods in react-native-screens. Swizzled method has
  different context of execution (self != ABI49_0_0REASharedTransitionManager)
*/
static ABI49_0_0REASharedTransitionManager *_sharedTransitionManager;

- (instancetype)initWithAnimationsManager:(ABI49_0_0REAAnimationsManager *)animationManager
{
  if (self = [super init]) {
    _snapshotRegistry = [NSMutableDictionary new];
    _currentSharedTransitionViews = [NSMutableDictionary new];
    _addedSharedViews = [NSMutableArray new];
    _sharedTransitionParent = [NSMutableDictionary new];
    _sharedTransitionInParentIndex = [NSMutableDictionary new];
    _isSharedTransitionActive = NO;
    _sharedElements = [NSMutableArray new];
    _animationManager = animationManager;
    _viewsToHide = [NSMutableSet new];
    _sharedTransitionManager = self;
    _viewsWithCanceledAnimation = [NSMutableSet new];
    _disableCleaningForView = [NSMutableDictionary new];
    _layoutedSharedViewsTags = [NSMutableSet new];
    _layoutedSharedViewsFrame = [NSMutableDictionary new];
    _isAsyncSharedTransitionConfigured = NO;
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

- (UIView *)getTransitioningView:(NSNumber *)tag
{
  return _currentSharedTransitionViews[tag];
}

- (void)notifyAboutNewView:(UIView *)view
{
  [_addedSharedViews addObject:view];
}

- (void)notifyAboutViewLayout:(UIView *)view withViewFrame:(CGRect)frame
{
  [_layoutedSharedViewsTags addObject:view.ABI49_0_0ReactTag];
  float x = frame.origin.x;
  float y = frame.origin.y;
  float width = frame.size.width;
  float height = frame.size.height;
  _layoutedSharedViewsFrame[view.ABI49_0_0ReactTag] = [[ABI49_0_0REAFrame alloc] initWithX:x y:y width:width height:height];
}

- (void)viewsDidLayout
{
  [self configureAsyncSharedTransitionForViews:_addedSharedViews];
  [_addedSharedViews removeAllObjects];
  [self maybeRestartAnimationWithNewLayout];
  [_layoutedSharedViewsTags removeAllObjects];
  [_layoutedSharedViewsFrame removeAllObjects];
}

- (void)configureAsyncSharedTransitionForViews:(NSArray<UIView *> *)views
{
  if ([views count] > 0) {
    NSArray *sharedViews = [self sortViewsByTags:views];
    _sharedElements = [self getSharedElementForCurrentTransition:sharedViews withNewElements:YES];
    _isAsyncSharedTransitionConfigured = YES;
  }
}

- (void)maybeRestartAnimationWithNewLayout
{
  if ([_layoutedSharedViewsTags count] == 0 || [_currentSharedTransitionViews count] == 0) {
    return;
  }
  NSMutableArray<ABI49_0_0REASharedElement *> *sharedElementToRestart = [NSMutableArray new];
  for (ABI49_0_0REASharedElement *sharedElement in _sharedElements) {
    NSNumber *viewTag = sharedElement.targetView.ABI49_0_0ReactTag;
    if ([_layoutedSharedViewsTags containsObject:viewTag] && _currentSharedTransitionViews[viewTag]) {
      [sharedElementToRestart addObject:sharedElement];
    }
  }

  for (ABI49_0_0REASharedElement *sharedElement in sharedElementToRestart) {
    UIView *sourceView = sharedElement.sourceView;
    UIView *targetView = sharedElement.targetView;

    ABI49_0_0REASnapshot *newSourceViewSnapshot = [[ABI49_0_0REASnapshot alloc] initWithAbsolutePosition:sourceView];
    ABI49_0_0REASnapshot *currentTargetViewSnapshot = _snapshotRegistry[targetView.ABI49_0_0ReactTag];
    ABI49_0_0REAFrame *frameData = _layoutedSharedViewsFrame[targetView.ABI49_0_0ReactTag];
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

    [self disableCleaningForViewTag:sourceView.ABI49_0_0ReactTag];
    [self disableCleaningForViewTag:targetView.ABI49_0_0ReactTag];
  }
  [self startSharedTransition:sharedElementToRestart];
}

- (BOOL)configureAndStartSharedTransitionForViews:(NSArray<UIView *> *)views
{
  NSArray *sharedViews = [self sortViewsByTags:views];
  NSArray<ABI49_0_0REASharedElement *> *sharedElements = [self getSharedElementForCurrentTransition:sharedViews
                                                                           withNewElements:NO];
  if ([sharedElements count] == 0) {
    return NO;
  }
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
  return [views sortedArrayUsingComparator:^NSComparisonResult(UIView *view1, UIView *view2) {
    return [view2.ABI49_0_0ReactTag compare:view1.ABI49_0_0ReactTag];
  }];
}

- (NSMutableArray<ABI49_0_0REASharedElement *> *)getSharedElementForCurrentTransition:(NSArray *)sharedViews
                                                             withNewElements:(BOOL)addedNewScreen
{
  NSMutableArray<UIView *> *newTransitionViews = [NSMutableArray new];
  NSMutableArray<ABI49_0_0REASharedElement *> *sharedElements = [NSMutableArray new];
  NSMutableSet<NSNumber *> *currentSharedViewsTags = [NSMutableSet new];
  for (UIView *sharedView in sharedViews) {
    [currentSharedViewsTags addObject:sharedView.ABI49_0_0ReactTag];
  }
  for (UIView *sharedView in sharedViews) {
    // add observers
    UIView *sharedViewScreen = [ABI49_0_0REAScreensHelper getScreenForView:sharedView];
    UIView *stack = [ABI49_0_0REAScreensHelper getStackForView:sharedViewScreen];

    // find sibling for shared view
    NSNumber *siblingViewTag = _findPrecedingViewTagForTransition(sharedView.ABI49_0_0ReactTag);
    UIView *siblingView = nil;
    do {
      siblingView = [_animationManager viewForTag:siblingViewTag];
      if (siblingView == nil) {
        [self clearAllSharedConfigsForViewTag:siblingViewTag];
        siblingViewTag = _findPrecedingViewTagForTransition(sharedView.ABI49_0_0ReactTag);
      }
    } while (siblingView == nil && siblingViewTag != nil);

    if (siblingView == nil) {
      // the sibling of shared view doesn't exist yet
      continue;
    }

    UIView *viewSource;
    UIView *viewTarget;
    if (addedNewScreen) {
      viewSource = siblingView;
      viewTarget = sharedView;
    } else {
      viewSource = sharedView;
      viewTarget = siblingView;
    }

    bool isInCurrentTransition = false;
    if (_currentSharedTransitionViews[viewSource.ABI49_0_0ReactTag] || _currentSharedTransitionViews[viewTarget.ABI49_0_0ReactTag]) {
      isInCurrentTransition = true;
      if (addedNewScreen) {
        siblingViewTag = _findPrecedingViewTagForTransition(siblingView.ABI49_0_0ReactTag);
        siblingView = [_animationManager viewForTag:siblingViewTag];

        viewSource = siblingView;
        viewTarget = sharedView;
      }
    }

    if ([currentSharedViewsTags containsObject:viewSource.ABI49_0_0ReactTag] &&
        [currentSharedViewsTags containsObject:viewTarget.ABI49_0_0ReactTag]) {
      continue;
    }

    bool isModal = [ABI49_0_0REAScreensHelper isScreenModal:sharedViewScreen];
    // check valid target screen configuration
    int screensCount = [stack.ABI49_0_0ReactSubviews count];
    if (addedNewScreen && !isModal) {
      // is under top
      if (screensCount < 2) {
        continue;
      }
      UIView *viewSourceParentScreen = [ABI49_0_0REAScreensHelper getScreenForView:viewSource];
      UIView *screenUnderStackTop = stack.ABI49_0_0ReactSubviews[screensCount - 2];
      if (![screenUnderStackTop.ABI49_0_0ReactTag isEqual:viewSourceParentScreen.ABI49_0_0ReactTag] && !isInCurrentTransition) {
        continue;
      }
    } else if (!addedNewScreen) {
      // is on top
      UIView *viewTargetParentScreen = [ABI49_0_0REAScreensHelper getScreenForView:viewTarget];
      UIView *stackTarget = viewTargetParentScreen.ABI49_0_0ReactViewController.navigationController.topViewController.view;
      if (stackTarget != viewTargetParentScreen) {
        continue;
      }
    }

    if (isModal) {
      [_viewsToHide addObject:viewSource.ABI49_0_0ReactTag];
    }

    ABI49_0_0REASnapshot *sourceViewSnapshot = [[ABI49_0_0REASnapshot alloc] initWithAbsolutePosition:viewSource];
    if (addedNewScreen && !_currentSharedTransitionViews[viewSource.ABI49_0_0ReactTag]) {
      _snapshotRegistry[viewSource.ABI49_0_0ReactTag] = sourceViewSnapshot;
    }

    ABI49_0_0REASnapshot *targetViewSnapshot;
    if (addedNewScreen) {
      targetViewSnapshot = [[ABI49_0_0REASnapshot alloc] initWithAbsolutePosition:viewTarget];
      _snapshotRegistry[viewTarget.ABI49_0_0ReactTag] = targetViewSnapshot;
    } else {
      targetViewSnapshot = _snapshotRegistry[viewTarget.ABI49_0_0ReactTag];
    }

    [newTransitionViews addObject:viewSource];
    [newTransitionViews addObject:viewTarget];

    ABI49_0_0REASharedElement *sharedElement = [[ABI49_0_0REASharedElement alloc] initWithSourceView:viewSource
                                                                sourceViewSnapshot:sourceViewSnapshot
                                                                        targetView:viewTarget
                                                                targetViewSnapshot:targetViewSnapshot];
    [sharedElements addObject:sharedElement];
  }
  if ([newTransitionViews count] > 0) {
    for (NSNumber *viewTag in _currentSharedTransitionViews) {
      UIView *view = _currentSharedTransitionViews[viewTag];
      if ([newTransitionViews containsObject:view]) {
        [self disableCleaningForViewTag:viewTag];
      } else {
        [_viewsWithCanceledAnimation addObject:view];
      }
    }
    [_currentSharedTransitionViews removeAllObjects];
    for (UIView *view in newTransitionViews) {
      _currentSharedTransitionViews[view.ABI49_0_0ReactTag] = view;
    }
    for (UIView *view in [_viewsWithCanceledAnimation copy]) {
      [self cancelAnimation:view.ABI49_0_0ReactTag];
      [self finishSharedAnimation:view];
    }
  }
  if ([sharedElements count] != 0) {
    _sharedElements = sharedElements;
  }
  return sharedElements;
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
    // it replaces method for ABI49_0_0RNSScreenView class, so it can be done only once
    [self swizzleMethod:@selector(viewDidLayoutSubviews)
                   with:@selector(swizzled_viewDidLayoutSubviews)
               forClass:[ABI49_0_0RNSScreen class]];
    [self swizzleMethod:@selector(notifyWillDisappear)
                   with:@selector(swizzled_notifyWillDisappear)
               forClass:[ABI49_0_0RNSScreenView class]];
  });
#endif
}

- (void)swizzleMethod:(SEL)originalSelector with:(SEL)swizzledSelector forClass:(Class)originalClass
{
  Class class = [self class];
  Method originalMethod = class_getInstanceMethod(originalClass, originalSelector);
  Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
  IMP originalImp = method_getImplementation(originalMethod);
  IMP swizzledImp = method_getImplementation(swizzledMethod);
  class_replaceMethod(originalClass, swizzledSelector, originalImp, method_getTypeEncoding(originalMethod));
  class_replaceMethod(originalClass, originalSelector, swizzledImp, method_getTypeEncoding(swizzledMethod));
}

- (void)swizzled_viewDidLayoutSubviews
{
  // call original method from react-native-screens, self == ABI49_0_0RNScreen
  [self swizzled_viewDidLayoutSubviews];
  UIView *screen = [self valueForKey:@"screenView"];
  [_sharedTransitionManager screenAddedToStack:screen];
}

- (void)swizzled_notifyWillDisappear
{
  // call original method from react-native-screens, self == ABI49_0_0RNSScreenView
  [self swizzled_notifyWillDisappear];
  [_sharedTransitionManager screenRemovedFromStack:(UIView *)self];
}

- (void)screenAddedToStack:(UIView *)screen
{
  if (screen.superview != nil) {
    [self runAsyncSharedTransition];
  }
}

- (void)screenRemovedFromStack:(UIView *)screen
{
  UIView *stack = [ABI49_0_0REAScreensHelper getStackForView:screen];
  bool isModal = [ABI49_0_0REAScreensHelper isScreenModal:screen];
  bool isRemovedInParentStack = [self isRemovedFromHigherStack:screen];
  if ((stack != nil || isModal) && !isRemovedInParentStack) {
    bool isInteractive =
        [[[screen.ABI49_0_0ReactViewController valueForKey:@"transitionCoordinator"] valueForKey:@"interactive"] boolValue];
    // screen is removed from ABI49_0_0React tree (navigation.navigate(<screenName>))
    bool isScreenRemovedFromReactTree = [self isScreen:screen outsideStack:stack];
    // click on button goBack on native header
    bool isTriggeredByGoBackButton = [self isScreen:screen onTopOfStack:stack];
    bool shouldRunTransition = !isInteractive && (isScreenRemovedFromReactTree || isTriggeredByGoBackButton);
    if (shouldRunTransition) {
      [self runSharedTransitionForSharedViewsOnScreen:screen];
    } else {
      [self makeSnapshotForScreenViews:screen];
    }
    [self restoreViewsVisibility];
  } else {
    // removed stack
    [self clearConfigForStack:stack];
  }
}

- (void)makeSnapshotForScreenViews:(UIView *)screen
{
  ABI49_0_0REANodeFind(screen, ^int(id<ABI49_0_0RCTComponent> view) {
    NSNumber *viewTag = view.ABI49_0_0ReactTag;
    if (self->_currentSharedTransitionViews[viewTag]) {
      return false;
    }
    if ([self->_animationManager hasAnimationForTag:viewTag type:SHARED_ELEMENT_TRANSITION]) {
      ABI49_0_0REASnapshot *snapshot = [[ABI49_0_0REASnapshot alloc] initWithAbsolutePosition:(UIView *)view];
      self->_snapshotRegistry[viewTag] = snapshot;
    }
    return false;
  });
}

- (void)restoreViewsVisibility
{
  for (NSNumber *viewTag in _viewsToHide) {
    UIView *view = [_animationManager viewForTag:viewTag];
    view.hidden = NO;
  }
  [_viewsToHide removeAllObjects];
}

- (void)clearConfigForStack:(UIView *)stack
{
  for (UIView *child in stack.ABI49_0_0ReactSubviews) {
    ABI49_0_0REANodeFind(child, ^int(id<ABI49_0_0RCTComponent> _Nonnull view) {
      [self clearAllSharedConfigsForViewTag:view.ABI49_0_0ReactTag];
      return false;
    });
  }
}

- (BOOL)isScreen:(UIView *)screen outsideStack:(UIView *)stack
{
  for (UIView *child in stack.ABI49_0_0ReactSubviews) {
    if ([child.ABI49_0_0ReactTag isEqual:screen.ABI49_0_0ReactTag]) {
      return NO;
    }
  }
  return YES;
}

- (BOOL)isScreen:(UIView *)screen onTopOfStack:(UIView *)stack
{
  int screenCount = stack.ABI49_0_0ReactSubviews.count;
  return screenCount > 0 && screen == stack.ABI49_0_0ReactSubviews.lastObject;
}

- (BOOL)isRemovedFromHigherStack:(UIView *)screen
{
  UIView *stack = screen.ABI49_0_0ReactSuperview;
  while (stack != nil) {
    screen = stack.ABI49_0_0ReactViewController.navigationController.topViewController.view;
    if (screen == nil) {
      break;
    }
    if (screen.superview == nil) {
      return YES;
    }
    stack = screen.ABI49_0_0ReactSuperview;
  }
  return NO;
}

- (void)runSharedTransitionForSharedViewsOnScreen:(UIView *)screen
{
  NSMutableArray<UIView *> *removedViews = [NSMutableArray new];
  ABI49_0_0REANodeFind(screen, ^int(id<ABI49_0_0RCTComponent> view) {
    if ([self->_animationManager hasAnimationForTag:view.ABI49_0_0ReactTag type:SHARED_ELEMENT_TRANSITION]) {
      [removedViews addObject:(UIView *)view];
    }
    return false;
  });
  BOOL startedAnimation = [self configureAndStartSharedTransitionForViews:removedViews];
  if (startedAnimation) {
    _removedViews = removedViews;
  }
}

- (void)runAsyncSharedTransition
{
  if ([_sharedElements count] == 0 || !_isAsyncSharedTransitionConfigured) {
    return;
  }
  for (ABI49_0_0REASharedElement *sharedElement in _sharedElements) {
    UIView *viewTarget = sharedElement.targetView;
    ABI49_0_0REASnapshot *targetViewSnapshot = [[ABI49_0_0REASnapshot alloc] initWithAbsolutePosition:viewTarget];
    _snapshotRegistry[viewTarget.ABI49_0_0ReactTag] = targetViewSnapshot;
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
    UIView *mainWindow = UIApplication.sharedApplication.keyWindow;
    if (_transitionContainer == nil) {
      _transitionContainer = [UIView new];
    }
    [mainWindow addSubview:_transitionContainer];
    [mainWindow bringSubviewToFront:_transitionContainer];
  }
}

- (void)reparentSharedViewsForCurrentTransition:(NSArray *)sharedElements
{
  for (ABI49_0_0REASharedElement *sharedElement in sharedElements) {
    UIView *viewSource = sharedElement.sourceView;
    UIView *viewTarget = sharedElement.targetView;
    if (_sharedTransitionParent[viewSource.ABI49_0_0ReactTag] == nil) {
      _sharedTransitionParent[viewSource.ABI49_0_0ReactTag] = viewSource.superview;
      _sharedTransitionInParentIndex[viewSource.ABI49_0_0ReactTag] = @([viewSource.superview.subviews indexOfObject:viewSource]);
      [viewSource removeFromSuperview];
      [_transitionContainer addSubview:viewSource];
    }

    if (_sharedTransitionParent[viewTarget.ABI49_0_0ReactTag] == nil) {
      _sharedTransitionParent[viewTarget.ABI49_0_0ReactTag] = viewTarget.superview;
      _sharedTransitionInParentIndex[viewTarget.ABI49_0_0ReactTag] = @([viewTarget.superview.subviews indexOfObject:viewTarget]);
      [viewTarget removeFromSuperview];
      [_transitionContainer addSubview:viewTarget];
    }
  }
}

- (void)startSharedTransition:(NSArray *)sharedElements
{
  for (ABI49_0_0REASharedElement *sharedElement in sharedElements) {
    [self onViewTransition:sharedElement.sourceView
                    before:sharedElement.sourceViewSnapshot
                     after:sharedElement.targetViewSnapshot];
    [self onViewTransition:sharedElement.targetView
                    before:sharedElement.sourceViewSnapshot
                     after:sharedElement.targetViewSnapshot];
  }
}

- (void)onViewTransition:(UIView *)view before:(ABI49_0_0REASnapshot *)before after:(ABI49_0_0REASnapshot *)after
{
  NSMutableDictionary *targetValues = after.values;
  NSMutableDictionary *currentValues = before.values;
  [view.superview bringSubviewToFront:view];
  NSDictionary *preparedValues = [_animationManager prepareDataForLayoutAnimatingWorklet:currentValues
                                                                            targetValues:targetValues];
  [_animationManager startAnimationForTag:view.ABI49_0_0ReactTag
                                     type:SHARED_ELEMENT_TRANSITION
                               yogaValues:preparedValues
                                    depth:@(0)];
}

- (void)finishSharedAnimation:(UIView *)view
{
  NSNumber *viewTag = view.ABI49_0_0ReactTag;
  if (_disableCleaningForView[viewTag]) {
    [self enableCleaningForViewTag:viewTag];
    return;
  }
  if (_currentSharedTransitionViews[viewTag] || [_viewsWithCanceledAnimation containsObject:view]) {
    [view removeFromSuperview];
    UIView *parent = _sharedTransitionParent[viewTag];
    int childIndex = [_sharedTransitionInParentIndex[viewTag] intValue];
    UIView *screen = [ABI49_0_0REAScreensHelper getScreenForView:parent];
    bool isScreenInReactTree = screen.ABI49_0_0ReactSuperview != nil;
    if (isScreenInReactTree) {
      [parent insertSubview:view atIndex:childIndex];
      ABI49_0_0REASnapshot *viewSourcePreviousSnapshot = _snapshotRegistry[viewTag];
      [_animationManager progressLayoutAnimationWithStyle:viewSourcePreviousSnapshot.values
                                                   forTag:viewTag
                                       isSharedTransition:YES];
      float originXByParent = [viewSourcePreviousSnapshot.values[@"originXByParent"] floatValue];
      float originYByParent = [viewSourcePreviousSnapshot.values[@"originYByParent"] floatValue];
      CGRect frame = CGRectMake(originXByParent, originYByParent, view.frame.size.width, view.frame.size.height);
      [view setFrame:frame];
    }
    if ([_viewsToHide containsObject:viewTag]) {
      view.hidden = YES;
    }
    [_currentSharedTransitionViews removeObjectForKey:viewTag];
    [_sharedTransitionParent removeObjectForKey:viewTag];
    [_sharedTransitionInParentIndex removeObjectForKey:viewTag];
    [_viewsWithCanceledAnimation removeObject:view];
    if ([_removedViews containsObject:view]) {
      [_animationManager clearAnimationConfigForTag:viewTag];
    }
  }
  if ([_currentSharedTransitionViews count] == 0) {
    [_transitionContainer removeFromSuperview];
    [_removedViews removeAllObjects];
    [_sharedElements removeAllObjects];
    _isSharedTransitionActive = NO;
  }
}

- (void)setFindPrecedingViewTagForTransitionBlock:
    (ABI49_0_0REAFindPrecedingViewTagForTransitionBlock)findPrecedingViewTagForTransition
{
  _findPrecedingViewTagForTransition = findPrecedingViewTagForTransition;
}

- (void)setCancelAnimationBlock:(ABI49_0_0REACancelAnimationBlock)cancelAnimationBlock
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
  _cancelLayoutAnimation(viewTag, SHARED_ELEMENT_TRANSITION, YES, YES);
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

@end
