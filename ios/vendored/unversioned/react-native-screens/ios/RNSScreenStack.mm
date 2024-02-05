#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTFabricComponentsPlugins.h>
#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/UIView+React.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/RCTComponentViewHelpers.h>
#else
#import <React/RCTBridge.h>
#import <React/RCTRootContentView.h>
#import <React/RCTShadowView.h>
#import <React/RCTTouchHandler.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerUtils.h>
#endif // RCT_NEW_ARCH_ENABLED

#import "RNSScreen.h"
#import "RNSScreenStack.h"
#import "RNSScreenStackAnimator.h"
#import "RNSScreenStackHeaderConfig.h"
#import "RNSScreenWindowTraits.h"

#ifdef RCT_NEW_ARCH_ENABLED
namespace react = facebook::react;
#endif // RCT_NEW_ARCH_ENABLED

@interface RNSScreenStackView () <
    UINavigationControllerDelegate,
    UIAdaptivePresentationControllerDelegate,
    UIGestureRecognizerDelegate,
    UIViewControllerTransitioningDelegate
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    RCTMountingTransactionObserving
#endif
    >

@property (nonatomic) NSMutableArray<UIViewController *> *presentedModals;
@property (nonatomic) BOOL updatingModals;
@property (nonatomic) BOOL scheduleModalsUpdate;

@end

@implementation RNSNavigationController

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

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  if ([self.topViewController isKindOfClass:[RNSScreen class]]) {
    RNSScreen *screenController = (RNSScreen *)self.topViewController;
    BOOL isNotDismissingModal = screenController.presentedViewController == nil ||
        (screenController.presentedViewController != nil &&
         ![screenController.presentedViewController isBeingDismissed]);

    // Calculate header height during simple transition from one screen to another.
    // If RNSScreen includes a navigation controller of type RNSNavigationController, it should not calculate
    // header height, as it could have nested stack.
    if (![screenController hasNestedStack] && isNotDismissingModal) {
      [screenController calculateAndNotifyHeaderHeightChangeIsModal:NO];
    }
  }
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
  BOOL _invalidated;
  BOOL _isFullWidthSwiping;
  UIPercentDrivenInteractiveTransition *_interactionController;
  BOOL _hasLayout;
  __weak RNSScreenStackManager *_manager;
  BOOL _updateScheduled;
#ifdef RCT_NEW_ARCH_ENABLED
  UIView *_snapshot;
#endif
}

#ifdef RCT_NEW_ARCH_ENABLED
- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const react::RNSScreenStackProps>();
    _props = defaultProps;
    [self initCommonProps];
  }

  return self;
}
#endif // RCT_NEW_ARCH_ENABLED

- (instancetype)initWithManager:(RNSScreenStackManager *)manager
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
  _reactSubviews = [NSMutableArray new];
  _presentedModals = [NSMutableArray new];
  _controller = [RNSNavigationController new];
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

#pragma mark - helper methods

- (BOOL)shouldCancelDismissFromView:(RNSScreenView *)fromView toView:(RNSScreenView *)toView
{
  int fromIndex = (int)[_reactSubviews indexOfObject:fromView];
  int toIndex = (int)[_reactSubviews indexOfObject:toView];
  for (int i = fromIndex; i > toIndex; i--) {
    if (_reactSubviews[i].preventNativeDismiss) {
      return YES;
      break;
    }
  }
  return NO;
}

#pragma mark - Common

- (void)emitOnFinishTransitioningEvent
{
#ifdef RCT_NEW_ARCH_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const react::RNSScreenStackEventEmitter>(_eventEmitter)
        ->onFinishTransitioning(react::RNSScreenStackEventEmitter::OnFinishTransitioning{});
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
#ifdef RCT_NEW_ARCH_ENABLED
  if (![view isKindOfClass:[RNSScreenView class]]) {
    // if the current view is a snapshot, config was already removed so we don't trigger the method
    return;
  }
#endif
  RNSScreenStackHeaderConfig *config = nil;
  for (UIView *subview in view.reactSubviews) {
    if ([subview isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
      config = (RNSScreenStackHeaderConfig *)subview;
      break;
    }
  }
  [RNSScreenStackHeaderConfig willShowViewController:viewController animated:animated withConfig:config];
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  // We don't directly set presentation delegate but instead rely on the ScreenView's delegate to
  // forward certain calls to the container (Stack).
  if ([presentationController.presentedViewController isKindOfClass:[RNSScreen class]]) {
    // we trigger the update of status bar's appearance here because there is no other lifecycle method
    // that can handle it when dismissing a modal, the same for orientation
    [RNSScreenWindowTraits updateWindowTraits];
    [_presentedModals removeObject:presentationController.presentedViewController];

    _updatingModals = NO;
#ifdef RCT_NEW_ARCH_ENABLED
    [self emitOnFinishTransitioningEvent];
#else
    // we double check if there are no new controllers pending to be presented since someone could
    // have tried to push another one during the transition.
    // We don't do it on Fabric since update of container will be triggered from "unmount" method afterwards
    [self updateContainer];
    if (self.onFinishTransitioning) {
      // instead of directly triggering onFinishTransitioning this time we enqueue the event on the
      // main queue. We do that because onDismiss event is also enqueued and we want for the transition
      // finish event to arrive later than onDismiss (see RNSScreen#notifyDismiss)
      dispatch_async(dispatch_get_main_queue(), ^{
        [self emitOnFinishTransitioningEvent];
      });
    }
#endif
  }
}

- (NSArray<UIView *> *)reactSubviews
{
  return _reactSubviews;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
#ifdef RCT_NEW_ARCH_ENABLED
  // for handling nested stacks
  [self maybeAddToParentAndUpdateContainer];
#else
  if (!_invalidated) {
    // We check whether the view has been invalidated before running side-effects in didMoveToWindow
    // This is needed because when LayoutAnimations are used it is possible for view to be re-attached
    // to a window despite the fact it has been removed from the React Native view hierarchy.
    [self maybeAddToParentAndUpdateContainer];
  }
#endif
}

- (void)maybeAddToParentAndUpdateContainer
{
  BOOL wasScreenMounted = _controller.parentViewController != nil;
#ifdef RCT_NEW_ARCH_ENABLED
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

+ (UIViewController *)findTopMostPresentedViewControllerFromViewController:(UIViewController *)controller
{
  auto presentedVc = controller;
  while (presentedVc.presentedViewController != nil) {
    presentedVc = presentedVc.presentedViewController;
  }
  return presentedVc;
}

- (UIViewController *)findReactRootViewController
{
  UIView *parent = self;
  while (parent) {
    parent = parent.reactSuperview;
    if (parent.isReactRootView) {
      return parent.reactViewController;
    }
  }
  return nil;
}

- (UIViewController *)lastFromPresentedViewControllerChainStartingFrom:(UIViewController *)vc
{
  UIViewController *lastNonNullVc = vc;
  UIViewController *lastVc = vc.presentedViewController;
  while (lastVc != nil) {
    lastNonNullVc = lastVc;
    lastVc = lastVc.presentedViewController;
  }
  return lastNonNullVc;
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

  // We need to find bottom-most view controller that should stay on the stack
  // for the duration of transition. There are couple of scenarios:
  // (1) No modals are presented or all modals were presented by this RNSNavigationController,
  // (2) There are modals presented by other RNSNavigationControllers (nested/outer)

  // Last controller that is common for both _presentedModals & controllers
  __block UIViewController *changeRootController = _controller;
  // Last common controller index + 1
  NSUInteger changeRootIndex = 0;
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
            ((RNSScreen *)next).screenView.stackAnimation != RNSScreenStackAnimationNone;

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

  UIViewController *firstModalToBeDismissed = changeRootController.presentedViewController;
  if (firstModalToBeDismissed != nil) {
    BOOL shouldAnimate = changeRootIndex == controllers.count &&
        [firstModalToBeDismissed isKindOfClass:[RNSScreen class]] &&
        ((RNSScreen *)firstModalToBeDismissed).screenView.stackAnimation != RNSScreenStackAnimationNone;

    if ([_presentedModals containsObject:firstModalToBeDismissed]) {
      // We dismiss every VC that was presented by changeRootController VC or its descendant.
      // After the series of dismissals is completed we run completion block in which
      // we present modals on top of changeRootController (which may be the this stack VC)
      [changeRootController dismissViewControllerAnimated:shouldAnimate completion:finish];
      return;
    }

    UIViewController *lastModalVc = [self lastFromPresentedViewControllerChainStartingFrom:firstModalToBeDismissed];

    if (lastModalVc != firstModalToBeDismissed) {
      [lastModalVc dismissViewControllerAnimated:shouldAnimate completion:finish];
      return;
    }
  }

  // changeRootController does not have presentedViewController but it does not mean that no modals are in presentation,
  // so we need to find top-level controller manually
  UIViewController *reactRootVc = [self findReactRootViewController];
  UIViewController *topMostVc = [RNSScreenStackView findTopMostPresentedViewControllerFromViewController:reactRootVc];

  if (topMostVc != reactRootVc) {
    changeRootController = topMostVc;
  }

  finish();
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
#ifdef RCT_NEW_ARCH_ENABLED
  UIViewController *previousTop = _controller.topViewController;
#else
  UIViewController *previousTop = _controller.viewControllers.lastObject;
#endif

  // At the start we set viewControllers to contain a single UIViewController
  // instance. This is a workaround for header height adjustment bug (see comment
  // in the init function). Here, we need to detect if the initial empty
  // controller is still there
  BOOL firstTimePush = ![previousTop isKindOfClass:[RNSScreen class]];

  if (firstTimePush) {
    // nothing pushed yet
    [_controller setViewControllers:controllers animated:NO];
  } else if (top != previousTop) {
    if (![controllers containsObject:previousTop]) {
      // if the previous top screen does not exist anymore and the new top was not on the stack before, probably replace
      // was called, so we check the animation
      if (![_controller.viewControllers containsObject:top] &&
          ((RNSScreenView *)top.view).replaceAnimation == RNSScreenReplaceAnimationPush) {
        // setting new controllers with animation does `push` animation by default
#ifdef RCT_NEW_ARCH_ENABLED
        auto screenController = (RNSScreen *)top;
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
#ifdef RCT_NEW_ARCH_ENABLED
      auto screenController = (RNSScreen *)top;
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

- (void)layoutSubviews
{
  [super layoutSubviews];
  _controller.view.frame = self.bounds;
}

- (void)dismissOnReload
{
#ifdef RCT_NEW_ARCH_ENABLED
  if ([_controller.visibleViewController isKindOfClass:[RNSScreen class]]) {
    [(RNSScreen *)_controller.visibleViewController resetViewToScreen];
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
  RNSScreenView *screen;
  if (operation == UINavigationControllerOperationPush) {
    screen = ((RNSScreen *)toVC).screenView;
  } else if (operation == UINavigationControllerOperationPop) {
    screen = ((RNSScreen *)fromVC).screenView;
  }
  BOOL shouldCancelDismiss = [self shouldCancelDismissFromView:(RNSScreenView *)fromVC.view
                                                        toView:(RNSScreenView *)toVC.view];
  if (screen != nil &&
      // when preventing the native dismiss with back button, we have to return the animator.
      // Also, we need to return the animator when full width swiping even if the animation is not custom,
      // otherwise the screen will be just popped immediately due to no animation
      ((operation == UINavigationControllerOperationPop && shouldCancelDismiss) || _isFullWidthSwiping ||
       [RNSScreenStackAnimator isCustomAnimation:screen.stackAnimation])) {
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
#ifdef RCT_NEW_ARCH_ENABLED
    RCTSurfaceTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
#else
    RCTTouchHandler *touchHandler = [parent performSelector:@selector(touchHandler)];
#endif
    [touchHandler setEnabled:NO];
    [touchHandler setEnabled:YES];
    [touchHandler reset];
  }
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  RNSScreenView *topScreen = _reactSubviews.lastObject;

#if TARGET_OS_TV
  [self cancelTouchesInParent];
  return YES;
#else
  // RNSPanGestureRecognizer will receive events iff topScreen.fullScreenSwipeEnabled == YES;
  // Events are filtered in gestureRecognizer:shouldReceivePressOrTouchEvent: method
  if ([gestureRecognizer isKindOfClass:[RNSPanGestureRecognizer class]]) {
    if ([self isInGestureResponseDistance:gestureRecognizer topScreen:topScreen]) {
      _isFullWidthSwiping = YES;
      [self cancelTouchesInParent];
      return YES;
    }
    return NO;
  }

  // Now we're dealing with RNSScreenEdgeGestureRecognizer (or _UIParallaxTransitionPanGestureRecognizer)
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
  RNSScreenView *topScreen = _reactSubviews.lastObject;
  float translation;
  float velocity;
  float distance;
  if (topScreen.swipeDirection == RNSScreenSwipeDirectionVertical) {
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
  RNSScreenView *fromView = [_controller.transitionCoordinator viewForKey:UITransitionContextFromViewKey];
  RNSScreenView *toView = [_controller.transitionCoordinator viewForKey:UITransitionContextToViewKey];
  // we can intercept clicking back button here, we check reactSuperview since this method also fires when
  // navigating back from JS
  if (_interactionController == nil && fromView.reactSuperview) {
    BOOL shouldCancelDismiss = [self shouldCancelDismissFromView:fromView toView:toView];
    if (shouldCancelDismiss) {
      _interactionController = [UIPercentDrivenInteractiveTransition new];
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.01 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self->_interactionController cancelInteractiveTransition];
        self->_interactionController = nil;
        int fromIndex = (int)[self->_reactSubviews indexOfObject:fromView];
        int toIndex = (int)[self->_reactSubviews indexOfObject:toView];
        int indexDiff = fromIndex - toIndex;
        int dismissCount = indexDiff > 0 ? indexDiff : 1;
        [self updateContainer];
        [fromView notifyDismissCancelledWithDismissCount:dismissCount];
      });
    }
  }
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
  [RNSScreenWindowTraits updateWindowTraits];
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

- (UIViewController *)reactViewController
{
  return _controller;
}

- (BOOL)isInGestureResponseDistance:(UIGestureRecognizer *)gestureRecognizer topScreen:(RNSScreenView *)topScreen
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
// RNSScreenStackView is a UIGestureRecognizerDelegate for three types of gesture recognizers:
// RNSPanGestureRecognizer, RNSScreenEdgeGestureRecognizer, _UIParallaxTransitionPanGestureRecognizer
// Be careful when adding another type of gesture recognizer.
- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceivePressOrTouchEvent:(NSObject *)event
{
  RNSScreenView *topScreen = _reactSubviews.lastObject;

  if (![topScreen isKindOfClass:[RNSScreenView class]] || !topScreen.gestureEnabled ||
      _controller.viewControllers.count < 2 || [topScreen isModal]) {
    return NO;
  }

  // We want to pass events to RNSPanGestureRecognizer iff full screen swipe is enabled.
  if ([gestureRecognizer isKindOfClass:[RNSPanGestureRecognizer class]]) {
    return topScreen.fullScreenSwipeEnabled;
  }

  // RNSScreenEdgeGestureRecognizer || _UIParallaxTransitionPanGestureRecognizer
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
  if ([gestureRecognizer isKindOfClass:[RNSPanGestureRecognizer class]] &&
      [self isScrollViewPanGestureRecognizer:otherGestureRecognizer]) {
    RNSPanGestureRecognizer *panGestureRecognizer = (RNSPanGestureRecognizer *)gestureRecognizer;
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

#ifdef RCT_NEW_ARCH_ENABLED
#pragma mark - Fabric specific

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[RNSScreenView class]]) {
    RCTLogError(@"ScreenStack only accepts children of type Screen");
    return;
  }

  RCTAssert(
      childComponentView.reactSuperview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  [_reactSubviews insertObject:(RNSScreenView *)childComponentView atIndex:index];
  ((RNSScreenView *)childComponentView).reactSuperview = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [self maybeAddToParentAndUpdateContainer];
  });
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  RNSScreenView *screenChildComponent = (RNSScreenView *)childComponentView;
  // We should only do a snapshot of a screen that is on the top.
  // We also check `_presentedModals` since if you push 2 modals, second one is not a "child" of _controller.
  // Also, when dissmised with a gesture, the screen already is not under the window, so we don't need to apply
  // snapshot.
  if (screenChildComponent.window != nil &&
      ((screenChildComponent == _controller.visibleViewController.view && _presentedModals.count < 2) ||
       screenChildComponent == [_presentedModals.lastObject view])) {
    [screenChildComponent.controller setViewToSnapshot:_snapshot];
  }

  RCTAssert(
      screenChildComponent.reactSuperview == self,
      @"Attempt to unmount a view which is mounted inside different view. (parent: %@, child: %@, index: %@)",
      self,
      screenChildComponent,
      @(index));
  RCTAssert(
      (_reactSubviews.count > index) && [_reactSubviews objectAtIndex:index] == childComponentView,
      @"Attempt to unmount a view which has a different index. (parent: %@, child: %@, index: %@, actual index: %@, tag at index: %@)",
      self,
      screenChildComponent,
      @(index),
      @([_reactSubviews indexOfObject:screenChildComponent]),
      @([[_reactSubviews objectAtIndex:index] tag]));
  screenChildComponent.reactSuperview = nil;
  [_reactSubviews removeObject:screenChildComponent];
  [screenChildComponent removeFromSuperview];
  dispatch_async(dispatch_get_main_queue(), ^{
    [self maybeAddToParentAndUpdateContainer];
  });
}

- (void)takeSnapshot
{
  _snapshot = [_controller.visibleViewController.view snapshotViewAfterScreenUpdates:NO];
}

- (void)mountingTransactionWillMount:(react::MountingTransaction const &)transaction
                withSurfaceTelemetry:(react::SurfaceTelemetry const &)surfaceTelemetry
{
  for (auto &mutation : transaction.getMutations()) {
    if (mutation.type == react::ShadowViewMutation::Type::Remove && mutation.parentShadowView.componentName != nil &&
        strcmp(mutation.parentShadowView.componentName, "RNSScreenStack") == 0) {
      [self takeSnapshot];
      return;
    }
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _reactSubviews = [NSMutableArray new];

  for (UIViewController *controller in _presentedModals) {
    [controller dismissViewControllerAnimated:NO completion:nil];
  }

  [_presentedModals removeAllObjects];
  [self dismissOnReload];
  [_controller willMoveToParentViewController:nil];
  [_controller removeFromParentViewController];
  [_controller setViewControllers:@[ [UIViewController new] ]];
}

+ (react::ComponentDescriptorProvider)componentDescriptorProvider
{
  return react::concreteComponentDescriptorProvider<react::RNSScreenStackComponentDescriptor>();
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

#endif // RCT_NEW_ARCH_ENABLED

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSScreenStackCls(void)
{
  return RNSScreenStackView.class;
}
#endif

@implementation RNSScreenStackManager {
  NSPointerArray *_stacks;
}

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(onFinishTransitioning, RCTDirectEventBlock);

#ifdef RCT_NEW_ARCH_ENABLED
#else
- (UIView *)view
{
  RNSScreenStackView *view = [[RNSScreenStackView alloc] initWithManager:self];
  if (!_stacks) {
    _stacks = [NSPointerArray weakObjectsPointerArray];
  }
  [_stacks addPointer:(__bridge void *)view];
  return view;
}
#endif // RCT_NEW_ARCH_ENABLED

- (void)invalidate
{
  for (RNSScreenStackView *stack in _stacks) {
    [stack dismissOnReload];
  }
  _stacks = nil;
}

@end
