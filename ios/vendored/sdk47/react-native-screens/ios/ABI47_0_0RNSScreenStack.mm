#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTMountingTransactionObserving.h>
#import <ABI47_0_0React/ABI47_0_0RCTSurfaceTouchHandler.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI47_0_0RCTComponentViewHelpers.h>

#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>

#else
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootContentView.h>
#import <ABI47_0_0React/ABI47_0_0RCTShadowView.h>
#import <ABI47_0_0React/ABI47_0_0RCTTouchHandler.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerUtils.h>
#endif // RN_FABRIC_ENABLED

#import "ABI47_0_0RNSScreen.h"
#import "ABI47_0_0RNSScreenStack.h"
#import "ABI47_0_0RNSScreenStackAnimator.h"
#import "ABI47_0_0RNSScreenStackHeaderConfig.h"
#import "ABI47_0_0RNSScreenWindowTraits.h"

@interface ABI47_0_0RNSScreenStackView () <
    UINavigationControllerDelegate,
    UIAdaptivePresentationControllerDelegate,
    UIGestureRecognizerDelegate,
    UIViewControllerTransitioningDelegate
#ifdef RN_FABRIC_ENABLED
    ,
    ABI47_0_0RCTMountingTransactionObserving
#endif
    >

@property (nonatomic) NSMutableArray<UIViewController *> *presentedModals;
@property (nonatomic) BOOL updatingModals;
@property (nonatomic) BOOL scheduleModalsUpdate;

@end

@implementation ABI47_0_0RNScreensNavigationController

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

- (UIViewController *)childViewControllerForHomeIndicatorAutoHidden
{
  return [self topViewController];
}
#endif

@end

#if !TARGET_OS_TV
@interface ABI47_0_0RNSScreenEdgeGestureRecognizer : UIScreenEdgePanGestureRecognizer
@end

@implementation ABI47_0_0RNSScreenEdgeGestureRecognizer
@end

@interface ABI47_0_0RNSPanGestureRecognizer : UIPanGestureRecognizer
@end

@implementation ABI47_0_0RNSPanGestureRecognizer
@end
#endif

@implementation ABI47_0_0RNSScreenStackView {
  UINavigationController *_controller;
  NSMutableArray<ABI47_0_0RNSScreenView *> *_ABI47_0_0ReactSubviews;
  BOOL _invalidated;
  BOOL _isFullWidthSwiping;
  UIPercentDrivenInteractiveTransition *_interactionController;
  BOOL _hasLayout;
  __weak ABI47_0_0RNSScreenStackManager *_manager;
  BOOL _updateScheduled;
#ifdef RN_FABRIC_ENABLED
  UIView *_snapshot;
#endif
}

#ifdef RN_FABRIC_ENABLED
- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackProps>();
    _props = defaultProps;
    [self initCommonProps];
  }

  return self;
}
#endif // RN_FABRIC_ENABLED

- (instancetype)initWithManager:(ABI47_0_0RNSScreenStackManager *)manager
{
  if (self = [super init]) {
    _hasLayout = NO;
    _invalidated = NO;
    _manager = manager;
    [self initCommonProps];
  }
  return self;
}

- (void)initCommonProps
{
  _ABI47_0_0ReactSubviews = [NSMutableArray new];
  _presentedModals = [NSMutableArray new];
  _controller = [ABI47_0_0RNScreensNavigationController new];
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

#pragma mark - Common

- (void)emitOnFinishTransitioningEvent
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackEventEmitter>(_eventEmitter)
        ->onFinishTransitioning(ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackEventEmitter::OnFinishTransitioning{});
  }
#else
  if (self.onFinishTransitioning) {
    self.onFinishTransitioning(nil);
  }
#endif
}

- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  UIView *view = viewController.view;
#ifdef RN_FABRIC_ENABLED
  if (![view isKindOfClass:[ABI47_0_0RNSScreenView class]]) {
    // if the current view is a snapshot, config was already removed so we don't trigger the method
    return;
  }
#endif
  ABI47_0_0RNSScreenStackHeaderConfig *config = nil;
  for (UIView *subview in view.ABI47_0_0ReactSubviews) {
    if ([subview isKindOfClass:[ABI47_0_0RNSScreenStackHeaderConfig class]]) {
      config = (ABI47_0_0RNSScreenStackHeaderConfig *)subview;
      break;
    }
  }
  [ABI47_0_0RNSScreenStackHeaderConfig willShowViewController:viewController animated:animated withConfig:config];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  // We don't directly set presentation delegate but instead rely on the ScreenView's delegate to
  // forward certain calls to the container (Stack).
  if ([presentationController.presentedViewController isKindOfClass:[ABI47_0_0RNSScreen class]]) {
    // we trigger the update of status bar's appearance here because there is no other lifecycle method
    // that can handle it when dismissing a modal, the same for orientation
    [ABI47_0_0RNSScreenWindowTraits updateWindowTraits];
    [_presentedModals removeObject:presentationController.presentedViewController];

    _updatingModals = NO;
#ifdef RN_FABRIC_ENABLED
    [self emitOnFinishTransitioningEvent];
#else
    // we double check if there are no new controllers pending to be presented since someone could
    // have tried to push another one during the transition.
    // We don't do it on Fabric since update of container will be triggered from "unmount" method afterwards
    [self updateContainer];
    if (self.onFinishTransitioning) {
      // instead of directly triggering onFinishTransitioning this time we enqueue the event on the
      // main queue. We do that because onDismiss event is also enqueued and we want for the transition
      // finish event to arrive later than onDismiss (see ABI47_0_0RNSScreen#notifyDismiss)
      dispatch_async(dispatch_get_main_queue(), ^{
        [self emitOnFinishTransitioningEvent];
      });
    }
#endif
  }
}

- (NSArray<UIView *> *)ABI47_0_0ReactSubviews
{
  return _ABI47_0_0ReactSubviews;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
#ifdef RN_FABRIC_ENABLED
  // for handling nested stacks
  [self maybeAddToParentAndUpdateContainer];
#else
  if (!_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the ABI47_0_0React Native view hierarchy.
    [self maybeAddToParentAndUpdateContainer];
  }
#endif
}

- (void)maybeAddToParentAndUpdateContainer
{
  BOOL wasScreenMounted = _controller.parentViewController != nil;
#ifdef RN_FABRIC_ENABLED
  BOOL isScreenReadyForShowing = self.window;
#else
  BOOL isScreenReadyForShowing = self.window && _hasLayout;
#endif
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
    [self ABI47_0_0ReactAddControllerToClosestParent:_controller];
    [self updateContainer];
  }
}

- (void)ABI47_0_0ReactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.ABI47_0_0ReactSuperview;
    while (parentView) {
      if (parentView.ABI47_0_0ReactViewController) {
        [parentView.ABI47_0_0ReactViewController addChildViewController:controller];
        [self addSubview:controller.view];
#if !TARGET_OS_TV
        _controller.interactivePopGestureRecognizer.delegate = self;
#endif
        [controller didMoveToParentViewController:parentView.ABI47_0_0ReactViewController];
        // On iOS pre 12 we observed that `willShowViewController` delegate method does not always
        // get triggered when the navigation controller is instantiated. As the only thing we do in
        // that delegate method is ask nav header to update to the current state it does not hurt to
        // trigger that logic from here too such that we can be sure the header is properly updated.
        [self navigationController:_controller willShowViewController:_controller.topViewController animated:NO];
        break;
      }
      parentView = (UIView *)parentView.ABI47_0_0ReactSuperview;
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
      ABI47_0_0RCTAssert(false, @"Modally presented controllers are being reshuffled, this is not allowed");
    }
  }

  __weak ABI47_0_0RNSScreenStackView *weakSelf = self;

  void (^afterTransitions)(void) = ^{
    [weakSelf emitOnFinishTransitioningEvent];
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
    [ABI47_0_0RNSScreenWindowTraits updateWindowTraits];
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

        BOOL shouldAnimate = lastModal && [next isKindOfClass:[ABI47_0_0RNSScreen class]] &&
            ((ABI47_0_0RNSScreen *)next).screenView.stackAnimation != ABI47_0_0RNSScreenStackAnimationNone;

        // if you want to present another modal quick enough after dismissing the previous one,
        // it will result in wrong changeRootController, see repro in
        // https://github.com/software-mansion/react-native-screens/issues/1299 We call `updateContainer` again in
        // `presentationControllerDidDismiss` to cover this case and present new controller
        if (previous.beingDismissed) {
          return;
        }

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
        [changeRootController.presentedViewController isKindOfClass:[ABI47_0_0RNSScreen class]] &&
        ((ABI47_0_0RNSScreen *)changeRootController.presentedViewController).screenView.stackAnimation !=
            ABI47_0_0RNSScreenStackAnimationNone;
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
      __weak ABI47_0_0RNSScreenStackView *weakSelf = self;
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
#ifdef RN_FABRIC_ENABLED
  UIViewController *previousTop = _controller.topViewController;
#else
  UIViewController *previousTop = _controller.viewControllers.lastObject;
#endif

  // At the start we set viewControllers to contain a single UIViewController
  // instance. This is a workaround for header height adjustment bug (see comment
  // in the init function). Here, we need to detect if the initial empty
  // controller is still there
  BOOL firstTimePush = ![previousTop isKindOfClass:[ABI47_0_0RNSScreen class]];

  if (firstTimePush) {
    // nothing pushed yet
    [_controller setViewControllers:controllers animated:NO];
  } else if (top != previousTop) {
    if (![controllers containsObject:previousTop]) {
      // if the previous top screen does not exist anymore and the new top was not on the stack before, probably replace
      // was called, so we check the animation
      if (![_controller.viewControllers containsObject:top] &&
          ((ABI47_0_0RNSScreenView *)top.view).replaceAnimation == ABI47_0_0RNSScreenReplaceAnimationPush) {
        // setting new controllers with animation does `push` animation by default
#ifdef RN_FABRIC_ENABLED
        auto screenController = (ABI47_0_0RNSScreen *)top;
        [screenController resetViewToScreen];
#endif
        [_controller setViewControllers:controllers animated:YES];
      } else {
        // last top controller is no longer on stack
        // in this case we set the controllers stack to the new list with
        // added the last top element to it and perform (animated) pop
        NSMutableArray *newControllers = [NSMutableArray arrayWithArray:controllers];
        [newControllers addObject:previousTop];
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
#ifdef RN_FABRIC_ENABLED
      auto screenController = (ABI47_0_0RNSScreen *)top;
      [screenController resetViewToScreen];
#endif
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
  for (ABI47_0_0RNSScreenView *screen in _ABI47_0_0ReactSubviews) {
    if (!screen.dismissed && screen.controller != nil) {
      if (pushControllers.count == 0) {
        // first screen on the list needs to be places as "push controller"
        [pushControllers addObject:screen.controller];
      } else {
        if (screen.stackPresentation == ABI47_0_0RNSScreenStackPresentationPush) {
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

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
}

- (void)dismissOnReload
{
#ifdef RN_FABRIC_ENABLED
  if ([_controller.visibleViewController isKindOfClass:[ABI47_0_0RNSScreen class]]) {
    [(ABI47_0_0RNSScreen *)_controller.visibleViewController resetViewToScreen];
  }
#else
  dispatch_async(dispatch_get_main_queue(), ^{
    [self invalidate];
  });
#endif
}

#pragma mark methods connected to transitioning

- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                  animationControllerForOperation:(UINavigationControllerOperation)operation
                                               fromViewController:(UIViewController *)fromVC
                                                 toViewController:(UIViewController *)toVC
{
  ABI47_0_0RNSScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = ((ABI47_0_0RNSScreen *)toVC).screenView;
  } else if (operation == UINavigationControllerOperationPop) {
    screen = ((ABI47_0_0RNSScreen *)fromVC).screenView;
  }
  if (screen != nil &&
      // we need to return the animator when full width swiping even if the animation is not custom,
      // otherwise the screen will be just popped immediately due to no animation
      (_isFullWidthSwiping || [ABI47_0_0RNSScreenStackAnimator isCustomAnimation:screen.stackAnimation])) {
    return [[ABI47_0_0RNSScreenStackAnimator alloc] initWithOperation:operation];
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
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTSurfaceTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
#else
    ABI47_0_0RCTTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
#endif
    [touchHandler setEnabled:NO];
    [touchHandler setEnabled:YES];
    [touchHandler reset];
  }
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  ABI47_0_0RNSScreenView *topScreen = _ABI47_0_0ReactSubviews.lastObject;

#if TARGET_OS_TV
  [self cancelTouchesInParent];
  return YES;
#else
  // ABI47_0_0RNSPanGestureRecognizer will receive events iff topScreen.fullScreenSwipeEnabled == YES;
  // Events are filtered in gestureRecognizer:shouldReceivePressOrTouchEvent: method
  if ([gestureRecognizer isKindOfClass:[ABI47_0_0RNSPanGestureRecognizer class]]) {
    if ([self isInGestureResponseDistance:gestureRecognizer topScreen:topScreen]) {
      _isFullWidthSwiping = YES;
      [self cancelTouchesInParent];
      return YES;
    }
    return NO;
  }

  // Now we're dealing with ABI47_0_0RNSScreenEdgeGestureRecognizer (or _UIParallaxTransitionPanGestureRecognizer)
  if (topScreen.customAnimationOnSwipe && [ABI47_0_0RNSScreenStackAnimator isCustomAnimation:topScreen.stackAnimation]) {
    if ([gestureRecognizer isKindOfClass:[ABI47_0_0RNSScreenEdgeGestureRecognizer class]]) {
      // if we do not set any explicit `semanticContentAttribute`, it is `UISemanticContentAttributeUnspecified` instead
      // of `UISemanticContentAttributeForceLeftToRight`, so we just check if it is RTL or not
      BOOL isCorrectEdge = (_controller.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft &&
                            ((ABI47_0_0RNSScreenEdgeGestureRecognizer *)gestureRecognizer).edges == UIRectEdgeRight) ||
          (_controller.view.semanticContentAttribute != UISemanticContentAttributeForceRightToLeft &&
           ((ABI47_0_0RNSScreenEdgeGestureRecognizer *)gestureRecognizer).edges == UIRectEdgeLeft);
      if (isCorrectEdge) {
        [self cancelTouchesInParent];
        return YES;
      }
    }
    return NO;
  } else {
    if ([gestureRecognizer isKindOfClass:[ABI47_0_0RNSScreenEdgeGestureRecognizer class]]) {
      // it should only recognize with `customAnimationOnSwipe` set
      return NO;
    }
    // _UIParallaxTransitionPanGestureRecognizer (other...)
    [self cancelTouchesInParent];
    return YES;
  }

#endif // TARGET_OS_TV
}

#if !TARGET_OS_TV
- (void)setupGestureHandlers
{
  // gesture recognizers for custom stack animations
  ABI47_0_0RNSScreenEdgeGestureRecognizer *leftEdgeSwipeGestureRecognizer =
      [[ABI47_0_0RNSScreenEdgeGestureRecognizer alloc] initWithTarget:self action:@selector(handleSwipe:)];
  leftEdgeSwipeGestureRecognizer.edges = UIRectEdgeLeft;
  leftEdgeSwipeGestureRecognizer.delegate = self;
  [self addGestureRecognizer:leftEdgeSwipeGestureRecognizer];

  ABI47_0_0RNSScreenEdgeGestureRecognizer *rightEdgeSwipeGestureRecognizer =
      [[ABI47_0_0RNSScreenEdgeGestureRecognizer alloc] initWithTarget:self action:@selector(handleSwipe:)];
  rightEdgeSwipeGestureRecognizer.edges = UIRectEdgeRight;
  rightEdgeSwipeGestureRecognizer.delegate = self;
  [self addGestureRecognizer:rightEdgeSwipeGestureRecognizer];

  // gesture recognizer for full width swipe gesture
  ABI47_0_0RNSPanGestureRecognizer *panRecognizer = [[ABI47_0_0RNSPanGestureRecognizer alloc] initWithTarget:self
                                                                                    action:@selector(handleSwipe:)];
  panRecognizer.delegate = self;
  [self addGestureRecognizer:panRecognizer];
}

- (void)handleSwipe:(UIPanGestureRecognizer *)gestureRecognizer
{
  ABI47_0_0RNSScreenView *topScreen = _ABI47_0_0ReactSubviews.lastObject;
  float translation;
  float velocity;
  float distance;
  if (topScreen.swipeDirection == ABI47_0_0RNSScreenSwipeDirectionVertical) {
    translation = [gestureRecognizer translationInView:gestureRecognizer.view].y;
    velocity = [gestureRecognizer velocityInView:gestureRecognizer.view].y;
    distance = gestureRecognizer.view.bounds.size.height;
  } else {
    translation = [gestureRecognizer translationInView:gestureRecognizer.view].x;
    velocity = [gestureRecognizer velocityInView:gestureRecognizer.view].x;
    distance = gestureRecognizer.view.bounds.size.width;
    BOOL isRTL = _controller.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft;
    if (isRTL) {
      translation = -translation;
      velocity = -velocity;
    }
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

- (void)navigationController:(UINavigationController *)navigationController
       didShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  [self emitOnFinishTransitioningEvent];
  [ABI47_0_0RNSScreenWindowTraits updateWindowTraits];
}
#endif

- (void)markChildUpdated
{
  // do nothing
}

- (void)didUpdateChildren
{
  // do nothing
}

- (UIViewController *)ABI47_0_0ReactViewController
{
  return _controller;
}

- (BOOL)isInGestureResponseDistance:(UIGestureRecognizer *)gestureRecognizer topScreen:(ABI47_0_0RNSScreenView *)topScreen
{
  NSDictionary *gestureResponseDistanceValues = topScreen.gestureResponseDistance;
  float x = [gestureRecognizer locationInView:gestureRecognizer.view].x;
  float y = [gestureRecognizer locationInView:gestureRecognizer.view].y;
  BOOL isRTL = _controller.view.semanticContentAttribute == UISemanticContentAttributeForceRightToLeft;
  if (isRTL) {
    x = _controller.view.frame.size.width - x;
  }

  // see:
  // https://github.com/software-mansion/react-native-screens/pull/1442/commits/74d4bae321875d8305ad021b3d448ebf713e7d56
  // this prop is always default initialized so we do not expect any nils
  float start = [gestureResponseDistanceValues[@"start"] floatValue];
  float end = [gestureResponseDistanceValues[@"end"] floatValue];
  float top = [gestureResponseDistanceValues[@"top"] floatValue];
  float bottom = [gestureResponseDistanceValues[@"bottom"] floatValue];

  // we check if any of the constraints are violated and return NO if so
  return !(
      (start != -1 && x < start) || (end != -1 && x > end) || (top != -1 && y < top) || (bottom != -1 && y > bottom));
}

// By default, the header buttons that are not inside the native hit area
// cannot be clicked, so we check it by ourselves
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (CGRectContainsPoint(_controller.navigationBar.frame, point)) {
    // headerConfig should be the first subview of the topmost screen
    UIView *headerConfig = [[_ABI47_0_0ReactSubviews.lastObject ABI47_0_0ReactSubviews] firstObject];
    if ([headerConfig isKindOfClass:[ABI47_0_0RNSScreenStackHeaderConfig class]]) {
      UIView *headerHitTestResult = [headerConfig hitTest:point withEvent:event];
      if (headerHitTestResult != nil) {
        return headerHitTestResult;
      }
    }
  }
  return [super hitTest:point withEvent:event];
}

#if !TARGET_OS_TV

- (BOOL)isScrollViewPanGestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
{
  // NOTE: This hack is required to restore native behavior of edge swipe (interactive pop gesture)
  // without this, on a screen with a scroll view, it's only possible to pop view by panning horizontally
  // if even slightly diagonal (or if in motion), scroll view will scroll, and edge swipe will be cancelled
  if (![[gestureRecognizer view] isKindOfClass:[UIScrollView class]]) {
    return NO;
  }
  UIScrollView *scrollView = (UIScrollView *)gestureRecognizer.view;
  return scrollView.panGestureRecognizer == gestureRecognizer;
}

// Custom method for compatibility with iOS < 13.4
// ABI47_0_0RNSScreenStackView is a UIGestureRecognizerDelegate for three types of gesture recognizers:
// ABI47_0_0RNSPanGestureRecognizer, ABI47_0_0RNSScreenEdgeGestureRecognizer, _UIParallaxTransitionPanGestureRecognizer
// Be careful when adding another type of gesture recognizer.
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceivePressOrTouchEvent:(NSObject *)event
{
  ABI47_0_0RNSScreenView *topScreen = _ABI47_0_0ReactSubviews.lastObject;

  if (![topScreen isKindOfClass:[ABI47_0_0RNSScreenView class]] || !topScreen.gestureEnabled ||
      _controller.viewControllers.count < 2 || [topScreen isModal]) {
    return NO;
  }

  // We want to pass events to ABI47_0_0RNSPanGestureRecognizer iff full screen swipe is enabled.
  if ([gestureRecognizer isKindOfClass:[ABI47_0_0RNSPanGestureRecognizer class]]) {
    return topScreen.fullScreenSwipeEnabled;
  }

  // ABI47_0_0RNSScreenEdgeGestureRecognizer || _UIParallaxTransitionPanGestureRecognizer
  return YES;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceivePress:(UIPress *)press;
{
  return [self gestureRecognizer:gestureRecognizer shouldReceivePressOrTouchEvent:press];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch;
{
  return [self gestureRecognizer:gestureRecognizer shouldReceivePressOrTouchEvent:touch];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  if ([gestureRecognizer isKindOfClass:[ABI47_0_0RNSPanGestureRecognizer class]] &&
      [self isScrollViewPanGestureRecognizer:otherGestureRecognizer]) {
    ABI47_0_0RNSPanGestureRecognizer *panGestureRecognizer = (ABI47_0_0RNSPanGestureRecognizer *)gestureRecognizer;
    BOOL isBackGesture = [panGestureRecognizer translationInView:panGestureRecognizer.view].x > 0 &&
        _controller.viewControllers.count > 1;

    if (gestureRecognizer.state == UIGestureRecognizerStateBegan || isBackGesture) {
      return NO;
    }

    return YES;
  }
  return NO;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return (
      [gestureRecognizer isKindOfClass:[UIScreenEdgePanGestureRecognizer class]] &&
      [self isScrollViewPanGestureRecognizer:otherGestureRecognizer]);
}

#endif // !TARGET_OS_TV

- (void)insertABI47_0_0ReactSubview:(ABI47_0_0RNSScreenView *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[ABI47_0_0RNSScreenView class]]) {
    ABI47_0_0RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }
  subview.ABI47_0_0ReactSuperview = self;
  [_ABI47_0_0ReactSubviews insertObject:subview atIndex:atIndex];
}

- (void)removeABI47_0_0ReactSubview:(ABI47_0_0RNSScreenView *)subview
{
  subview.ABI47_0_0ReactSuperview = nil;
  [_ABI47_0_0ReactSubviews removeObject:subview];
}

- (void)didUpdateABI47_0_0ReactSubviews
{
  // we need to wait until children have their layout set. At this point they don't have the layout
  // set yet, however the layout call is already enqueued on ui thread. Enqueuing update call on the
  // ui queue will guarantee that the update will run after layout.
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_hasLayout = YES;
    [self maybeAddToParentAndUpdateContainer];
  });
}

#ifdef RN_FABRIC_ENABLED
#pragma mark - Fabric specific

- (void)mountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[ABI47_0_0RNSScreenView class]]) {
    ABI47_0_0RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }

  ABI47_0_0RCTAssert(
      childComponentView.ABI47_0_0ReactSuperview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  [_ABI47_0_0ReactSubviews insertObject:(ABI47_0_0RNSScreenView *)childComponentView atIndex:index];
  ((ABI47_0_0RNSScreenView *)childComponentView).ABI47_0_0ReactSuperview = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [self maybeAddToParentAndUpdateContainer];
  });
}

- (void)unmountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  ABI47_0_0RNSScreenView *screenChildComponent = (ABI47_0_0RNSScreenView *)childComponentView;
  // We should only do a snapshot of a screen that is on the top.
  // We also check `_presentedModals` since if you push 2 modals, second one is not a "child" of _controller.
  // Also, when dissmised with a gesture, the screen already is not under the window, so we don't need to apply
  // snapshot.
  if (screenChildComponent.window != nil &&
      ((screenChildComponent == _controller.visibleViewController.view && _presentedModals.count < 2) ||
       screenChildComponent == [_presentedModals.lastObject view])) {
    [screenChildComponent.controller setViewToSnapshot:_snapshot];
  }

  ABI47_0_0RCTAssert(
      screenChildComponent.ABI47_0_0ReactSuperview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      screenChildComponent,
      @(index));
  ABI47_0_0RCTAssert(
      (_ABI47_0_0ReactSubviews.count > index) && [_ABI47_0_0ReactSubviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      screenChildComponent,
      @(index),
      @([_ABI47_0_0ReactSubviews indexOfObject:screenChildComponent]),
      @([[_ABI47_0_0ReactSubviews objectAtIndex:index] tag]));
  screenChildComponent.ABI47_0_0ReactSuperview = nil;
  [_ABI47_0_0ReactSubviews removeObject:screenChildComponent];
  [screenChildComponent removeFromSuperview];
  dispatch_async(dispatch_get_main_queue(), ^{
    [self maybeAddToParentAndUpdateContainer];
  });
}

- (void)takeSnapshot
{
  _snapshot = [_controller.visibleViewController.view snapshotViewAfterScreenUpdates:NO];
}

- (void)mountingTransactionWillMount:(ABI47_0_0facebook::ABI47_0_0React::MountingTransaction const &)transaction
                withSurfaceTelemetry:(ABI47_0_0facebook::ABI47_0_0React::SurfaceTelemetry const &)surfaceTelemetry
{
  for (auto &mutation : transaction.getMutations()) {
    if (mutation.type == ABI47_0_0facebook::ABI47_0_0React::ShadowViewMutation::Type::Remove &&
        mutation.parentShadowView.componentName != nil &&
        strcmp(mutation.parentShadowView.componentName, "ABI47_0_0RNSScreenStack") == 0) {
      [self takeSnapshot];
      return;
    }
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _ABI47_0_0ReactSubviews = [NSMutableArray new];

  for (UIViewController *controller in _presentedModals) {
    [controller dismissViewControllerAnimated:NO completion:nil];
  }

  [_presentedModals removeAllObjects];
  [self dismissOnReload];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
  [_controller setViewControllers:@[ [UIViewController new] ]];
}

+ (ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI47_0_0facebook::ABI47_0_0React::concreteComponentDescriptorProvider<ABI47_0_0facebook::ABI47_0_0React::ABI47_0_0RNSScreenStackComponentDescriptor>();
}
#else
#pragma mark - Paper specific

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

#endif // RN_FABRIC_ENABLED

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSScreenStackCls(void)
{
  return ABI47_0_0RNSScreenStackView.class;
}
#endif

@implementation ABI47_0_0RNSScreenStackManager {
  NSPointerArray *_stacks;
}

ABI47_0_0RCT_EXPORT_MODULE()

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onFinishTransitioning, ABI47_0_0RCTDirectEventBlock);

#ifdef RN_FABRIC_ENABLED
#else
- (UIView *)view
{
  ABI47_0_0RNSScreenStackView *view = [[ABI47_0_0RNSScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}
#endif // RN_FABRIC_ENABLED

- (void)invalidate
{
  for (ABI47_0_0RNSScreenStackView *stack in _stacks) {
    [stack dismissOnReload];
  }
  _stacks = nil;
}

@end
