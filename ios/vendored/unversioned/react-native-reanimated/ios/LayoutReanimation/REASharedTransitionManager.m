#import <RNReanimated/REAFrame.h>
#import <RNReanimated/REAScreensHelper.h>
#import <RNReanimated/REASharedElement.h>
#import <RNReanimated/REASharedTransitionManager.h>
#import <objc/runtime.h>

@implementation REASharedTransitionManager {
  NSMutableDictionary<NSNumber *, UIView *> *_sharedTransitionParent;
  NSMutableDictionary<NSNumber *, NSNumber *> *_sharedTransitionInParentIndex;
  NSMutableDictionary<NSNumber *, REASnapshot *> *_snapshotRegistry;
  NSMutableDictionary<NSNumber *, UIView *> *_currentSharedTransitionViews;
  REAFindPrecedingViewTagForTransitionBlock _findPrecedingViewTagForTransition;
  REACancelAnimationBlock _cancelLayoutAnimation;
  UIView *_transitionContainer;
  NSMutableArray<UIView *> *_addedSharedViews;
  BOOL _isSharedTransitionActive;
  NSMutableArray<REASharedElement *> *_sharedElements;
  REAAnimationsManager *_animationManager;
  NSMutableSet<NSNumber *> *_viewsToHide;
  NSMutableArray<UIView *> *_removedViews;
  NSMutableSet<UIView *> *_viewsWithCanceledAnimation;
  NSMutableDictionary<NSNumber *, NSNumber *> *_disableCleaningForView;
  NSMutableSet<NSNumber *> *_layoutedSharedViewsTags;
  NSMutableDictionary<NSNumber *, REAFrame *> *_layoutedSharedViewsFrame;
  BOOL _isAsyncSharedTransitionConfigured;
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
  [_layoutedSharedViewsTags addObject:view.reactTag];
  float x = frame.origin.x;
  float y = frame.origin.y;
  float width = frame.size.width;
  float height = frame.size.height;
  _layoutedSharedViewsFrame[view.reactTag] = [[REAFrame alloc] initWithX:x y:y width:width height:height];
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
  NSMutableArray<REASharedElement *> *sharedElementToRestart = [NSMutableArray new];
  for (REASharedElement *sharedElement in _sharedElements) {
    NSNumber *viewTag = sharedElement.targetView.reactTag;
    if ([_layoutedSharedViewsTags containsObject:viewTag] && _currentSharedTransitionViews[viewTag]) {
      [sharedElementToRestart addObject:sharedElement];
    }
  }

  for (REASharedElement *sharedElement in sharedElementToRestart) {
    UIView *sourceView = sharedElement.sourceView;
    UIView *targetView = sharedElement.targetView;

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

- (BOOL)configureAndStartSharedTransitionForViews:(NSArray<UIView *> *)views
{
  NSArray *sharedViews = [self sortViewsByTags:views];
  NSArray<REASharedElement *> *sharedElements = [self getSharedElementForCurrentTransition:sharedViews
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
    return [view2.reactTag compare:view1.reactTag];
  }];
}

- (NSMutableArray<REASharedElement *> *)getSharedElementForCurrentTransition:(NSArray *)sharedViews
                                                             withNewElements:(BOOL)addedNewScreen
{
  NSMutableArray<UIView *> *newTransitionViews = [NSMutableArray new];
  NSMutableArray<REASharedElement *> *sharedElements = [NSMutableArray new];
  NSMutableSet<NSNumber *> *currentSharedViewsTags = [NSMutableSet new];
  for (UIView *sharedView in sharedViews) {
    [currentSharedViewsTags addObject:sharedView.reactTag];
  }
  for (UIView *sharedView in sharedViews) {
    // add observers
    UIView *sharedViewScreen = [REAScreensHelper getScreenForView:sharedView];
    UIView *stack = [REAScreensHelper getStackForView:sharedViewScreen];

    // find sibling for shared view
    NSNumber *siblingViewTag = _findPrecedingViewTagForTransition(sharedView.reactTag);
    UIView *siblingView = nil;
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
      UIView *viewSourceParentScreen = [REAScreensHelper getScreenForView:viewSource];
      UIView *screenUnderStackTop = stack.reactSubviews[screensCount - 2];
      if (![screenUnderStackTop.reactTag isEqual:viewSourceParentScreen.reactTag] && !isInCurrentTransition) {
        continue;
      }
    } else if (!addedNewScreen) {
      // is on top
      UIView *viewTargetParentScreen = [REAScreensHelper getScreenForView:viewTarget];
      UIView *stackTarget = viewTargetParentScreen.reactViewController.navigationController.topViewController.view;
      if (stackTarget != viewTargetParentScreen) {
        continue;
      }
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
    }

    [newTransitionViews addObject:viewSource];
    [newTransitionViews addObject:viewTarget];

    REASharedElement *sharedElement = [[REASharedElement alloc] initWithSourceView:viewSource
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
      _currentSharedTransitionViews[view.reactTag] = view;
    }
    for (UIView *view in [_viewsWithCanceledAnimation copy]) {
      [self cancelAnimation:view.reactTag];
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
    // it replaces method for RNSScreenView class, so it can be done only once
    [self swizzleMethod:@selector(viewDidLayoutSubviews)
                   with:@selector(swizzled_viewDidLayoutSubviews)
               forClass:[RNSScreen class]];
    [self swizzleMethod:@selector(notifyWillDisappear)
                   with:@selector(swizzled_notifyWillDisappear)
               forClass:[RNSScreenView class]];
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
  // call original method from react-native-screens, self == RNScreen
  [self swizzled_viewDidLayoutSubviews];
  UIView *screen = [self valueForKey:@"screenView"];
  [_sharedTransitionManager screenAddedToStack:screen];
}

- (void)swizzled_notifyWillDisappear
{
  // call original method from react-native-screens, self == RNSScreenView
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
  UIView *stack = [REAScreensHelper getStackForView:screen];
  bool isModal = [REAScreensHelper isScreenModal:screen];
  bool isRemovedInParentStack = [self isRemovedFromHigherStack:screen];
  if ((stack != nil || isModal) && !isRemovedInParentStack) {
    bool isInteractive =
        [[[screen.reactViewController valueForKey:@"transitionCoordinator"] valueForKey:@"interactive"] boolValue];
    // screen is removed from React tree (navigation.navigate(<screenName>))
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
  REANodeFind(screen, ^int(id<RCTComponent> view) {
    NSNumber *viewTag = view.reactTag;
    if (self->_currentSharedTransitionViews[viewTag]) {
      return false;
    }
    if ([self->_animationManager hasAnimationForTag:viewTag type:SHARED_ELEMENT_TRANSITION]) {
      REASnapshot *snapshot = [[REASnapshot alloc] initWithAbsolutePosition:(UIView *)view];
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
  for (UIView *child in stack.reactSubviews) {
    REANodeFind(child, ^int(id<RCTComponent> _Nonnull view) {
      [self clearAllSharedConfigsForViewTag:view.reactTag];
      return false;
    });
  }
}

- (BOOL)isScreen:(UIView *)screen outsideStack:(UIView *)stack
{
  for (UIView *child in stack.reactSubviews) {
    if ([child.reactTag isEqual:screen.reactTag]) {
      return NO;
    }
  }
  return YES;
}

- (BOOL)isScreen:(UIView *)screen onTopOfStack:(UIView *)stack
{
  int screenCount = stack.reactSubviews.count;
  return screenCount > 0 && screen == stack.reactSubviews.lastObject;
}

- (BOOL)isRemovedFromHigherStack:(UIView *)screen
{
  UIView *stack = screen.reactSuperview;
  while (stack != nil) {
    screen = stack.reactViewController.navigationController.topViewController.view;
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

- (void)runSharedTransitionForSharedViewsOnScreen:(UIView *)screen
{
  NSMutableArray<UIView *> *removedViews = [NSMutableArray new];
  REANodeFind(screen, ^int(id<RCTComponent> view) {
    if ([self->_animationManager hasAnimationForTag:view.reactTag type:SHARED_ELEMENT_TRANSITION]) {
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
  for (REASharedElement *sharedElement in _sharedElements) {
    UIView *viewTarget = sharedElement.targetView;
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
  for (REASharedElement *sharedElement in sharedElements) {
    UIView *viewSource = sharedElement.sourceView;
    UIView *viewTarget = sharedElement.targetView;
    if (_sharedTransitionParent[viewSource.reactTag] == nil) {
      _sharedTransitionParent[viewSource.reactTag] = viewSource.superview;
      _sharedTransitionInParentIndex[viewSource.reactTag] = @([viewSource.superview.subviews indexOfObject:viewSource]);
      [viewSource removeFromSuperview];
      [_transitionContainer addSubview:viewSource];
    }

    if (_sharedTransitionParent[viewTarget.reactTag] == nil) {
      _sharedTransitionParent[viewTarget.reactTag] = viewTarget.superview;
      _sharedTransitionInParentIndex[viewTarget.reactTag] = @([viewTarget.superview.subviews indexOfObject:viewTarget]);
      [viewTarget removeFromSuperview];
      [_transitionContainer addSubview:viewTarget];
    }
  }
}

- (void)startSharedTransition:(NSArray *)sharedElements
{
  for (REASharedElement *sharedElement in sharedElements) {
    [self onViewTransition:sharedElement.sourceView
                    before:sharedElement.sourceViewSnapshot
                     after:sharedElement.targetViewSnapshot];
    [self onViewTransition:sharedElement.targetView
                    before:sharedElement.sourceViewSnapshot
                     after:sharedElement.targetViewSnapshot];
  }
}

- (void)onViewTransition:(UIView *)view before:(REASnapshot *)before after:(REASnapshot *)after
{
  NSMutableDictionary *targetValues = after.values;
  NSMutableDictionary *currentValues = before.values;
  [view.superview bringSubviewToFront:view];
  NSDictionary *preparedValues = [_animationManager prepareDataForLayoutAnimatingWorklet:currentValues
                                                                            targetValues:targetValues];
  [_animationManager startAnimationForTag:view.reactTag
                                     type:SHARED_ELEMENT_TRANSITION
                               yogaValues:preparedValues
                                    depth:@(0)];
}

- (void)finishSharedAnimation:(UIView *)view
{
  NSNumber *viewTag = view.reactTag;
  if (_disableCleaningForView[viewTag]) {
    [self enableCleaningForViewTag:viewTag];
    return;
  }
  if (_currentSharedTransitionViews[viewTag] || [_viewsWithCanceledAnimation containsObject:view]) {
    [view removeFromSuperview];
    UIView *parent = _sharedTransitionParent[viewTag];
    int childIndex = [_sharedTransitionInParentIndex[viewTag] intValue];
    UIView *screen = [REAScreensHelper getScreenForView:parent];
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
