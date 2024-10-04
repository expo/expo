#import "RNSScreenStack.h"
#import "RNSScreen.h"
#import "RNSScreenStackAnimator.h"
#import "RNSScreenStackHeaderConfig.h"
#import "RNSScreenWindowTraits.h"

#import <React/RCTBridge.h>
#import <React/RCTRootContentView.h>
#import <React/RCTShadowView.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>

@interface RNSScreenStackView () <
    UINavigationControllerDelegate,
    UIAdaptivePresentationControllerDelegate,
    UIGestureRecognizerDelegate,
    UIViewControllerTransitioningDelegate>

@property (nonatomic) NSMutableArray<UIViewController *> *presentedModals;
@property (nonatomic) BOOL updatingModals;
@property (nonatomic) BOOL scheduleModalsUpdate;

@end

@implementation RNScreensNavigationController

#if !TARGET_OS_TV
- (UIViewController *)childViewControllerForStatusBarStyle
{
  return [self topViewController];
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  return [self topViewController].preferredStatusBarUpdateAnimation;
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  return [self topViewController];
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  return [self topViewController].supportedInterfaceOrientations;
}
#endif

@end

#if !TARGET_OS_TV
@interface RNSScreenEdgeGestureRecognizer : UIScreenEdgePanGestureRecognizer
@end

@implementation RNSScreenEdgeGestureRecognizer
@end

@interface RNSPanGestureRecognizer : UIPanGestureRecognizer
@end

@implementation RNSPanGestureRecognizer
@end
#endif

@implementation RNSScreenStackView {
  UINavigationController *_controller;
  NSMutableArray<RNSScreenView *> *_reactSubviews;
  __weak RNSScreenStackManager *_manager;
  BOOL _hasLayout;
  BOOL _invalidated;
  UIPercentDrivenInteractiveTransition *_interactionController;
  BOOL _updateScheduled;
  BOOL _isFullWidthSwiping;
}

- (instancetype)initWithManager:(RNSScreenStackManager *)manager
{
  if (self = [super init]) {
    _hasLayout = NO;
    _invalidated = NO;
    _manager = manager;
    _reactSubviews = [NSMutableArray new];
    _presentedModals = [NSMutableArray new];
    _controller = [[RNScreensNavigationController alloc] init];
    _controller.delegate = self;

#if !TARGET_OS_TV
    [self setupGestureHandlers];
#endif
    // we have to initialize viewControllers with a non empty array for
    // largeTitle header to render in the opened state. If it is empty
    // the header will render in collapsed state which is perhaps a bug
    // in UIKit but ¯\_(ツ)_/¯
    [_controller setViewControllers:@[ [UIViewController new] ]];
  }
  return self;
}

- (UIViewController *)reactViewController
{
  return _controller;
}

- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  UIView *view = viewController.view;
  RNSScreenStackHeaderConfig *config = nil;
  for (UIView *subview in view.reactSubviews) {
    if ([subview isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
      config = (RNSScreenStackHeaderConfig *)subview;
      break;
    }
  }
  [RNSScreenStackHeaderConfig willShowViewController:viewController animated:animated withConfig:config];
}

- (void)navigationController:(UINavigationController *)navigationController
       didShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  if (self.onFinishTransitioning) {
    self.onFinishTransitioning(nil);
  }
  [RNSScreenWindowTraits updateWindowTraits];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  // We don't directly set presentation delegate but instead rely on the ScreenView's delegate to
  // forward certain calls to the container (Stack).
  UIView *screenView = presentationController.presentedViewController.view;
  if ([screenView isKindOfClass:[RNSScreenView class]]) {
    // we trigger the update of status bar's appearance here because there is no other lifecycle method
    // that can handle it when dismissing a modal, the same for orientation
    [RNSScreenWindowTraits updateWindowTraits];
    [_presentedModals removeObject:presentationController.presentedViewController];
    if (self.onFinishTransitioning) {
      // instead of directly triggering onFinishTransitioning this time we enqueue the event on the
      // main queue. We do that because onDismiss event is also enqueued and we want for the transition
      // finish event to arrive later than onDismiss (see RNSScreen#notifyDismiss)
      dispatch_async(dispatch_get_main_queue(), ^{
        if (self.onFinishTransitioning) {
          self.onFinishTransitioning(nil);
        }
      });
    }
  }
}

- (void)markChildUpdated
{
  // do nothing
}

- (void)didUpdateChildren
{
  // do nothing
}

- (void)insertReactSubview:(RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[RNSScreenView class]]) {
    RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }
  subview.reactSuperview = self;
  [_reactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(RNSScreenView *)subview
{
  subview.reactSuperview = nil;
  [_reactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (void)didUpdateReactSubviews
{
  // we need to wait until children have their layout set. At this point they don't have the layout
  // set yet, however the layout call is already enqueued on ui thread. Enqueuing update call on the
  // ui queue will guarantee that the update will run after layout.
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_hasLayout = YES;
    [self maybeAddToParentAndUpdateContainer];
  });
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (!_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the React Native view hierarchy.
    [self maybeAddToParentAndUpdateContainer];
  }
}

- (void)maybeAddToParentAndUpdateContainer
{
  BOOL wasScreenMounted = _controller.parentViewController != nil;
  BOOL isScreenReadyForShowing = self.window && _hasLayout;
  if (!isScreenReadyForShowing && !wasScreenMounted) {
    // We wait with adding to parent controller until the stack is mounted and has its initial
    // layout done.
    // If we add it before layout, some of the items (specifically items from the navigation bar),
    // won't be able to position properly. Also the position and size of such items, even if it
    // happens to change, won't be properly updated (this is perhaps some internal issue of UIKit).
    // If we add it when window is not attached, some of the view transitions will be bloced (i.e.
    // modal transitions) and the internal view controler's state will get out of sync with what's
    // on screen without us knowing.
    return;
  }
  [self updateContainer];
  if (!wasScreenMounted) {
    // when stack hasn't been added to parent VC yet we do two things:
    // 1) we run updateContainer (the one above) – we do this because we want push view controllers to
    // be installed before the VC is mounted. If we do that after it is added to parent the push
    // updates operations are going to be blocked by UIKit.
    // 2) we add navigation VS to parent – this is needed for the VC lifecycle events to be dispatched
    // properly
    // 3) we again call updateContainer – this time we do this to open modal controllers. Modals
    // won't open in (1) because they require navigator to be added to parent. We handle that case
    // gracefully in setModalViewControllers and can retry opening at any point.
    [self reactAddControllerToClosestParent:_controller];
    [self updateContainer];
  }
}

- (void)reactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.reactViewController) {
        [parentView.reactViewController addChildViewController:controller];
        [self addSubview:controller.view];
#if !TARGET_OS_TV
        _controller.interactivePopGestureRecognizer.delegate = self;
#endif
        [controller didMoveToParentViewController:parentView.reactViewController];
        // On iOS pre 12 we observed that `willShowViewController` delegate method does not always
        // get triggered when the navigation controller is instantiated. As the only thing we do in
        // that delegate method is ask nav header to update to the current state it does not hurt to
        // trigger that logic from here too such that we can be sure the header is properly updated.
        [self navigationController:_controller willShowViewController:_controller.topViewController animated:NO];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}

- (void)setModalViewControllers:(NSArray<UIViewController *> *)controllers
{
  // prevent re-entry
  if (_updatingModals) {
    _scheduleModalsUpdate = YES;
    return;
  }

  // when there is no change we return immediately. This check is important because sometime we may
  // accidently trigger modal dismiss if we don't verify to run the below code only when an actual
  // change in the list of presented modal was made.
  if ([_presentedModals isEqualToArray:controllers]) {
    return;
  }

  // if view controller is not yet attached to window we skip updates now and run them when view
  // is attached
  if (self.window == nil && _presentedModals.lastObject.view.window == nil) {
    return;
  }

  _updatingModals = YES;

  NSMutableArray<UIViewController *> *newControllers = [NSMutableArray arrayWithArray:controllers];
  [newControllers removeObjectsInArray:_presentedModals];

  // find bottom-most controller that should stay on the stack for the duration of transition
  NSUInteger changeRootIndex = 0;
  UIViewController *changeRootController = _controller;
  for (NSUInteger i = 0; i < MIN(_presentedModals.count, controllers.count); i++) {
    if (_presentedModals[i] == controllers[i]) {
      changeRootController = controllers[i];
      changeRootIndex = i + 1;
    } else {
      break;
    }
  }

  // we verify that controllers added on top of changeRootIndex are all new. Unfortunately modal
  // VCs cannot be reshuffled (there are some visual glitches when we try to dismiss then show as
  // even non-animated dismissal has delay and updates the screen several times)
  for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
    if ([_presentedModals containsObject:controllers[i]]) {
      RCTAssert(false, @"Modally presented controllers are being reshuffled, this is not allowed");
    }
  }

  __weak RNSScreenStackView *weakSelf = self;

  void (^afterTransitions)(void) = ^{
    if (weakSelf.onFinishTransitioning) {
      weakSelf.onFinishTransitioning(nil);
    }
    weakSelf.updatingModals = NO;
    if (weakSelf.scheduleModalsUpdate) {
      // if modals update was requested during setModalViewControllers we set scheduleModalsUpdate
      // flag in order to perform updates at a later point. Here we are done with all modals
      // transitions and check this flag again. If it was set, we reset the flag and execute updates.
      weakSelf.scheduleModalsUpdate = NO;
      [weakSelf updateContainer];
    }
    // we trigger the update of orientation here because, when dismissing the modal from JS,
    // neither `viewWillAppear` nor `presentationControllerDidDismiss` are called, same for status bar.
    [RNSScreenWindowTraits updateWindowTraits];
  };

  void (^finish)(void) = ^{
    NSUInteger oldCount = weakSelf.presentedModals.count;
    if (changeRootIndex < oldCount) {
      [weakSelf.presentedModals removeObjectsInRange:NSMakeRange(changeRootIndex, oldCount - changeRootIndex)];
    }
    BOOL isAttached =
        changeRootController.parentViewController != nil || changeRootController.presentingViewController != nil;
    if (!isAttached || changeRootIndex >= controllers.count) {
      // if change controller view is not attached, presenting modals will silently fail on iOS.
      // In such a case we trigger controllers update from didMoveToWindow.
      // We also don't run any present transitions if changeRootIndex is greater or equal to the size
      // of new controllers array. This means that no new controllers should be presented.
      afterTransitions();
      return;
    } else {
      UIViewController *previous = changeRootController;
      for (NSUInteger i = changeRootIndex; i < controllers.count; i++) {
        UIViewController *next = controllers[i];
        BOOL lastModal = (i == controllers.count - 1);

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
        if (@available(iOS 13.0, tvOS 13.0, *)) {
          // Inherit UI style from its parent - solves an issue with incorrect style being applied to some UIKit views
          // like date picker or segmented control.
          next.overrideUserInterfaceStyle = self->_controller.overrideUserInterfaceStyle;
        }
#endif

        BOOL shouldAnimate = lastModal && [next isKindOfClass:[RNSScreen class]] &&
            ((RNSScreenView *)next.view).stackAnimation != RNSScreenStackAnimationNone;

        [previous presentViewController:next
                               animated:shouldAnimate
                             completion:^{
                               [weakSelf.presentedModals addObject:next];
                               if (lastModal) {
                                 afterTransitions();
                               };
                             }];
        previous = next;
      }
    }
  };

  if (changeRootController.presentedViewController != nil &&
      [_presentedModals containsObject:changeRootController.presentedViewController]) {
    BOOL shouldAnimate = changeRootIndex == controllers.count &&
        [changeRootController.presentedViewController isKindOfClass:[RNSScreen class]] &&
        ((RNSScreenView *)changeRootController.presentedViewController.view).stackAnimation !=
            RNSScreenStackAnimationNone;
    [changeRootController dismissViewControllerAnimated:shouldAnimate completion:finish];
  } else {
    finish();
  }
}

- (void)setPushViewControllers:(NSArray<UIViewController *> *)controllers
{
  // when there is no change we return immediately
  if ([_controller.viewControllers isEqualToArray:controllers]) {
    return;
  }

  // if view controller is not yet attached to window we skip updates now and run them when view
  // is attached
  if (self.window == nil) {
    return;
  }
  // when transition is ongoing, any updates made to the controller will not be reflected until the
  // transition is complete. In particular, when we push/pop view controllers we expect viewControllers
  // property to be updated immediately. Based on that property we then calculate future updates.
  // When the transition is ongoing the property won't be updated immediatly. We therefore avoid
  // making any updated when transition is ongoing and schedule updates for when the transition
  // is complete.
  if (_controller.transitionCoordinator != nil) {
    if (!_updateScheduled) {
      _updateScheduled = YES;
      __weak RNSScreenStackView *weakSelf = self;
      [_controller.transitionCoordinator
          animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
            // do nothing here, we only want to be notified when transition is complete
          }
          completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
            self->_updateScheduled = NO;
            [weakSelf updateContainer];
          }];
    }
    return;
  }

  UIViewController *top = controllers.lastObject;
  UIViewController *lastTop = _controller.viewControllers.lastObject;

  // at the start we set viewControllers to contain a single UIVIewController
  // instance. This is a workaround for header height adjustment bug (see comment
  // in the init function). Here, we need to detect if the initial empty
  // controller is still there
  BOOL firstTimePush = ![lastTop isKindOfClass:[RNSScreen class]];

  if (firstTimePush) {
    // nothing pushed yet
    [_controller setViewControllers:controllers animated:NO];
  } else if (top != lastTop) {
    // we always provide `animated:YES` since, if the user does not want the animation, he will provide
    // `stackAnimation: 'none'`, which will resolve in no animation anyways.
    if (![controllers containsObject:lastTop]) {
      // if the previous top screen does not exist anymore and the new top was not on the stack before, probably replace
      // was called, so we check the animation
      if (![_controller.viewControllers containsObject:top] &&
          ((RNSScreenView *)top.view).replaceAnimation == RNSScreenReplaceAnimationPush) {
        // setting new controllers with animation does `push` animation by default
        [_controller setViewControllers:controllers animated:YES];
      } else {
        // last top controller is no longer on stack
        // in this case we set the controllers stack to the new list with
        // added the last top element to it and perform (animated) pop
        NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
        [newControllers addObject:lastTop];
        [_controller setViewControllers:newControllers animated:NO];
        [_controller popViewControllerAnimated:YES];
      }
    } else if (![_controller.viewControllers containsObject:top]) {
      // new top controller is not on the stack
      // in such case we update the stack except from the last element with
      // no animation and do animated push of the last item
      NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
      [newControllers removeLastObject];
      [_controller setViewControllers:newControllers animated:NO];
      [_controller pushViewController:top animated:YES];
    } else {
      // don't really know what this case could be, but may need to handle it
      // somehow
      [_controller setViewControllers:controllers animated:NO];
    }
  } else {
    // change wasn't on the top of the stack. We don't need animation.
    [_controller setViewControllers:controllers animated:NO];
  }
}

- (void)updateContainer
{
  NSMutableArray<UIViewController *> *pushControllers = [NSMutableArray new];
  NSMutableArray<UIViewController *> *modalControllers = [NSMutableArray new];
  for (RNSScreenView *screen in _reactSubviews) {
    if (!screen.dismissed && screen.controller != nil) {
      if (pushControllers.count == 0) {
        // first screen on the list needs to be places as "push controller"
        [pushControllers addObject:screen.controller];
      } else {
        if (screen.stackPresentation == RNSScreenStackPresentationPush) {
          [pushControllers addObject:screen.controller];
        } else {
          [modalControllers addObject:screen.controller];
        }
      }
    }
  }

  [self setPushViewControllers:pushControllers];
  [self setModalViewControllers:modalControllers];
}

// By default, the header buttons that are not inside the native hit area
// cannot be clicked, so we check it by ourselves
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (CGRectContainsPoint(_controller.navigationBar.frame, point)) {
    // headerConfig should be the first subview of the topmost screen
    UIView *headerConfig = [[_reactSubviews.lastObject reactSubviews] firstObject];
    if ([headerConfig isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
      UIView *headerHitTestResult = [headerConfig hitTest:point withEvent:event];
      if (headerHitTestResult != nil) {
        return headerHitTestResult;
      }
    }
  }
  return [super hitTest:point withEvent:event];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
}

- (void)invalidate
{
  _invalidated = YES;
  for (UIViewController *controller in _presentedModals) {
    [controller dismissViewControllerAnimated:NO completion:nil];
  }
  [_presentedModals removeAllObjects];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
}

- (void)dismissOnReload
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
  });
}

#pragma mark methods connected to transitioning

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                  animationControllerForOperation:(UINavigationControllerOperation)operation
                                               fromViewController:(UIViewController *)fromVC
                                                 toViewController:(UIViewController *)toVC
{
  RNSScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = (RNSScreenView *)toVC.view;
  } else if (operation == UINavigationControllerOperationPop) {
    screen = (RNSScreenView *)fromVC.view;
  }
  if (screen != nil &&
      // we need to return the animator when full width swiping even if the animation is not custom,
      // otherwise the screen will be just popped immediately due to no animation
      (_isFullWidthSwiping || [RNSScreenStackAnimator isCustomAnimation:screen.stackAnimation])) {
    return [[RNSScreenStackAnimator alloc] initWithOperation:operation];
  }
  return nil;
}

- (void)cancelTouchesInParent
{
  // cancel touches in parent, this is needed to cancel RN touch events. For example when Touchable
  // item is close to an edge and we start pulling from edge we want the Touchable to be cancelled.
  // Without the below code the Touchable will remain active (highlighted) for the duration of back
  // gesture and onPress may fire when we release the finger.
  UIView *parent = _controller.view;
  while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)])
    parent = parent.superview;
  if (parent != nil) {
    RCTTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
    [touchHandler cancel];
    [touchHandler reset];
  }
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  RNSScreenView *topScreen = (RNSScreenView *)_controller.viewControllers.lastObject.view;

  if (![topScreen isKindOfClass:[RNSScreenView class]] || !topScreen.gestureEnabled ||
      _controller.viewControllers.count < 2) {
    return NO;
  }

#if TARGET_OS_TV
  [self cancelTouchesInParent];
  return YES;
#else
  if (topScreen.fullScreenSwipeEnabled) {
    // we want only `RNSPanGestureRecognizer` to be able to recognize when
    // `fullScreenSwipeEnabled` is set
    if ([gestureRecognizer isKindOfClass:[RNSPanGestureRecognizer class]]) {
      _isFullWidthSwiping = YES;
      [self cancelTouchesInParent];
      return YES;
    }
    return NO;
  }

  if (topScreen.customAnimationOnSwipe && [RNSScreenStackAnimator isCustomAnimation:topScreen.stackAnimation]) {
    if ([gestureRecognizer isKindOfClass:[RNSScreenEdgeGestureRecognizer class]]) {
      // if we do not set any explicit `semanticContentAttribute`, it is `UISemanticContentAttributeUnspecified` instead
      // of `UISemanticContentAttributeForceLeftToRight`, so we just check if it is RTL or not
      BOOL isCorrectEdge = (_controller.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft &&
                            ((RNSScreenEdgeGestureRecognizer *)gestureRecognizer).edges == UIRectEdgeRight) ||
          (_controller.view.semanticContentAttribute != UISemanticContentAttributeForceRightToLeft &&
           ((RNSScreenEdgeGestureRecognizer *)gestureRecognizer).edges == UIRectEdgeLeft);
      if (isCorrectEdge) {
        [self cancelTouchesInParent];
        return YES;
      }
    }
    return NO;
  } else {
    if ([gestureRecognizer isKindOfClass:[RNSScreenEdgeGestureRecognizer class]]) {
      // it should only recognize with `customAnimationOnSwipe` set
      return NO;
    } else if ([gestureRecognizer isKindOfClass:[RNSPanGestureRecognizer class]]) {
      // it should only recognize with `fullScreenSwipeEnabled` set
      return NO;
    }
    [self cancelTouchesInParent];
    return YES;
  }
#endif
}

#if !TARGET_OS_TV
- (void)setupGestureHandlers
{
  // gesture recognizers for custom stack animations
  RNSScreenEdgeGestureRecognizer *leftEdgeSwipeGestureRecognizer =
      [[RNSScreenEdgeGestureRecognizer alloc] initWithTarget:self action:@selector(handleSwipe:)];
  leftEdgeSwipeGestureRecognizer.edges = UIRectEdgeLeft;
  leftEdgeSwipeGestureRecognizer.delegate = self;
  [self addGestureRecognizer:leftEdgeSwipeGestureRecognizer];

  RNSScreenEdgeGestureRecognizer *rightEdgeSwipeGestureRecognizer =
      [[RNSScreenEdgeGestureRecognizer alloc] initWithTarget:self action:@selector(handleSwipe:)];
  rightEdgeSwipeGestureRecognizer.edges = UIRectEdgeRight;
  rightEdgeSwipeGestureRecognizer.delegate = self;
  [self addGestureRecognizer:rightEdgeSwipeGestureRecognizer];

  // gesture recognizer for full width swipe gesture
  RNSPanGestureRecognizer *panRecognizer = [[RNSPanGestureRecognizer alloc] initWithTarget:self
                                                                                    action:@selector(handleSwipe:)];
  panRecognizer.delegate = self;
  [self addGestureRecognizer:panRecognizer];
}

- (void)handleSwipe:(UIPanGestureRecognizer *)gestureRecognizer
{
  float translation = [gestureRecognizer translationInView:gestureRecognizer.view].x;
  float velocity = [gestureRecognizer velocityInView:gestureRecognizer.view].x;
  float distance = gestureRecognizer.view.bounds.size.width;
  BOOL isRTL = _controller.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft;
  if (isRTL) {
    translation = -translation;
    velocity = -velocity;
  }

  float transitionProgress = (translation / distance);

  switch (gestureRecognizer.state) {
    case UIGestureRecognizerStateBegan: {
      _interactionController = [UIPercentDrivenInteractiveTransition new];
      [_controller popViewControllerAnimated:YES];
      break;
    }

    case UIGestureRecognizerStateChanged: {
      [_interactionController updateInteractiveTransition:transitionProgress];
      break;
    }

    case UIGestureRecognizerStateCancelled: {
      [_interactionController cancelInteractiveTransition];
      break;
    }

    case UIGestureRecognizerStateEnded: {
      // values taken from
      // https://github.com/react-navigation/react-navigation/blob/54739828598d7072c1bf7b369659e3682db3edc5/packages/stack/src/views/Stack/Card.tsx#L316
      BOOL shouldFinishTransition = (translation + velocity * 0.3) > (distance / 2);
      if (shouldFinishTransition) {
        [_interactionController finishInteractiveTransition];
      } else {
        [_interactionController cancelInteractiveTransition];
      }
      _interactionController = nil;
    }
    default: {
      break;
    }
  }
}
#endif

- (id<UIViewControllerInteractiveTransitioning>)navigationController:(UINavigationController *)navigationController
                         interactionControllerForAnimationController:
                             (id<UIViewControllerAnimatedTransitioning>)animationController
{
  return _interactionController;
}

- (id<UIViewControllerInteractiveTransitioning>)interactionControllerForDismissal:
    (id<UIViewControllerAnimatedTransitioning>)animator
{
  return _interactionController;
}

@end

@implementation RNSScreenStackManager {
  NSPointerArray *_stacks;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onFinishTransitioning, RCTDirectEventBlock);

- (UIView *)view
{
  RNSScreenStackView *view = [[RNSScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}

- (void)invalidate
{
  for (RNSScreenStackView *stack in _stacks) {
    [stack dismissOnReload];
  }
  _stacks = nil;
}

@end
