#import <UIKit/UIKit.h>

#import "ABI44_0_0RNSScreen.h"
#import "ABI44_0_0RNSScreenContainer.h"
#import "ABI44_0_0RNSScreenStack.h"
#import "ABI44_0_0RNSScreenStackHeaderConfig.h"
#import "ABI44_0_0RNSScreenWindowTraits.h"

#import <ABI44_0_0React/ABI44_0_0RCTShadowView.h>
#import <ABI44_0_0React/ABI44_0_0RCTTouchHandler.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>

@interface ABI44_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate, ABI44_0_0RCTInvalidating>
@end

@implementation ABI44_0_0RNSScreenView {
  __weak ABI44_0_0RCTBridge *_bridge;
  ABI44_0_0RNSScreen *_controller;
  ABI44_0_0RCTTouchHandler *_touchHandler;
  CGRect _reactFrame;
}

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI44_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI44_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI44_0_0RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _replaceAnimation = ABI44_0_0RNSScreenReplaceAnimationPop;
    _dismissed = NO;
    _hasStatusBarStyleSet = NO;
    _hasStatusBarAnimationSet = NO;
    _hasStatusBarHiddenSet = NO;
    _hasOrientationSet = NO;
  }

  return self;
}

- (void)ABI44_0_0ReactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  UIViewController *parentVC = self.ABI44_0_0ReactViewController.parentViewController;
  if (parentVC != nil && ![parentVC isKindOfClass:[ABI44_0_0RNScreensNavigationController class]]) {
    [super ABI44_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under ABI44_0_0RNScreensNavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimensions and we wait for the screen VC to update and then we
  // pass the dimensions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)ABI44_0_0ReactViewController
{
  return _controller;
}

- (void)updateBounds
{
  [_bridge.uiManager setSize:self.bounds.size forView:self];
}

// Nil will be provided when activityState is set as an animated value and we change
// it from JS to be a plain value (non animated).
// In case when nil is received, we want to ignore such value and not make
// any updates as the actual non-nil value will follow immediately.
- (void)setActivityStateOrNil:(NSNumber *)activityStateOrNil
{
  int activityState = [activityStateOrNil intValue];
  if (activityStateOrNil != nil && activityState != _activityState) {
    _activityState = activityState;
    [_ABI44_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI44_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI44_0_0React props
}

- (void)setStackPresentation:(ABI44_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI44_0_0RNSScreenStackPresentationModal:
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
      if (@available(iOS 13.0, tvOS 13.0, *)) {
        _controller.modalPresentationStyle = UIModalPresentationAutomatic;
      } else {
        _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      }
#else
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
#endif
      break;
    case ABI44_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
#if !TARGET_OS_TV
    case ABI44_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
#endif
    case ABI44_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI44_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI44_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI44_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI44_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here:
    // https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI44_0_0RNSScreenStackPresentationPush) {
    ABI44_0_0RCTLogError(
        @"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI44_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI44_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
#if !TARGET_OS_TV
    case ABI44_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
#endif
    case ABI44_0_0RNSScreenStackAnimationNone:
    case ABI44_0_0RNSScreenStackAnimationDefault:
    case ABI44_0_0RNSScreenStackAnimationSimplePush:
    case ABI44_0_0RNSScreenStackAnimationSlideFromBottom:
    case ABI44_0_0RNSScreenStackAnimationFadeFromBottom:
      // Default
      break;
  }
}

- (void)setGestureEnabled:(BOOL)gestureEnabled
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, tvOS 13.0, *)) {
    _controller.modalInPresentation = !gestureEnabled;
  }
#endif

  _gestureEnabled = gestureEnabled;
}

- (void)setReplaceAnimation:(ABI44_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  _replaceAnimation = replaceAnimation;
}

#if !TARGET_OS_TV
- (void)setStatusBarStyle:(ABI44_0_0RNSStatusBarStyle)statusBarStyle
{
  _hasStatusBarStyleSet = YES;
  _statusBarStyle = statusBarStyle;
  [ABI44_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI44_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setStatusBarAnimation:(UIStatusBarAnimation)statusBarAnimation
{
  _hasStatusBarAnimationSet = YES;
  _statusBarAnimation = statusBarAnimation;
  [ABI44_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
}

- (void)setStatusBarHidden:(BOOL)statusBarHidden
{
  _hasStatusBarHiddenSet = YES;
  _statusBarHidden = statusBarHidden;
  [ABI44_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI44_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setScreenOrientation:(UIInterfaceOrientationMask)screenOrientation
{
  _hasOrientationSet = YES;
  _screenOrientation = screenOrientation;
  [ABI44_0_0RNSScreenWindowTraits enforceDesiredDeviceOrientation];
}
#endif

- (UIView *)ABI44_0_0ReactSuperview
{
  return _ABI44_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI44_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI44_0_0RNSScreenStackHeaderConfig *)view).screenView = self;
  }
}

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyDismissedWithCount:(int)dismissCount
{
  _dismissed = YES;
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(@{@"dismissCount" : @(dismissCount)});
      }
    });
  }
}

- (void)notifyWillAppear
{
  if (self.onWillAppear) {
    self.onWillAppear(nil);
  }
  // we do it here too because at this moment the `parentViewController` is already not nil,
  // so if the parent is not UINavCtr, the frame will be updated to the correct one.
  [self ABI44_0_0ReactSetFrame:_reactFrame];
}

- (void)notifyWillDisappear
{
  if (self.onWillDisappear) {
    self.onWillDisappear(nil);
  }
}

- (void)notifyAppear
{
  if (self.onAppear) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onAppear) {
        self.onAppear(nil);
      }
    });
  }
}

- (void)notifyDisappear
{
  if (self.onDisappear) {
    self.onDisappear(nil);
  }
}

- (void)notifyDismissCancelledWithDismissCount:(int)dismissCount
{
  if (self.onNativeDismissCancelled) {
    self.onNativeDismissCancelled(@{@"dismissCount" : @(dismissCount)});
  }
}

- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward
{
  if (self.onTransitionProgress) {
    self.onTransitionProgress(@{
      @"progress" : @(progress),
      @"closing" : @(closing ? 1 : 0),
      @"goingForward" : @(goingForward ? 1 : 0),
    });
  }
}

- (BOOL)isMountedUnderScreenOrReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI44_0_0RCTRootView class]] || [parent isKindOfClass:[ABI44_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect ABI44_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI44_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI44_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI44_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI44_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

- (ABI44_0_0RCTTouchHandler *)touchHandler
{
  if (_touchHandler != nil) {
    return _touchHandler;
  }
  UIView *parent = [self superview];
  while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)])
    parent = parent.superview;
  if (parent != nil) {
    return [parent performSelector:@selector(touchHandler)];
  }
  return nil;
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  if (_preventNativeDismiss) {
    [self notifyDismissCancelledWithDismissCount:1];
    return NO;
  }
  return _gestureEnabled;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_ABI44_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI44_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:) withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation ABI44_0_0RNSScreen {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
  UIView *_fakeView;
  CADisplayLink *_animationTimer;
  CGFloat _currentAlpha;
  BOOL _closing;
  BOOL _goingForward;
  int _dismissCount;
  BOOL _isSwiping;
  BOOL _shouldNotify;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    self.view = view;
    _shouldNotify = YES;
    _fakeView = [UIView new];
  }
  return self;
}

#if !TARGET_OS_TV
- (UIViewController *)childViewControllerForStatusBarStyle
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI44_0_0RNSWindowTraitStyle includingModals:NO];
  return vc == self ? nil : vc;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [ABI44_0_0RNSScreenWindowTraits statusBarStyleForRNSStatusBarStyle:((ABI44_0_0RNSScreenView *)self.view).statusBarStyle];
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI44_0_0RNSWindowTraitHidden includingModals:NO];
  return vc == self ? nil : vc;
}

- (BOOL)prefersStatusBarHidden
{
  return ((ABI44_0_0RNSScreenView *)self.view).statusBarHidden;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI44_0_0RNSWindowTraitAnimation includingModals:NO];

  if ([vc isKindOfClass:[ABI44_0_0RNSScreen class]]) {
    return ((ABI44_0_0RNSScreenView *)vc.view).statusBarAnimation;
  }
  return UIStatusBarAnimationFade;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI44_0_0RNSWindowTraitOrientation includingModals:YES];

  if ([vc isKindOfClass:[ABI44_0_0RNSScreen class]]) {
    return ((ABI44_0_0RNSScreenView *)vc.view).screenOrientation;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

// if the returned vc is a child, it means that it can provide config;
// if the returned vc is self, it means that there is no child for config and self has config to provide,
// so we return self which results in asking self for preferredStatusBarStyle/Animation etc.;
// if the returned vc is nil, it means none of children could provide config and self does not have config either,
// so if it was asked by parent, it will fallback to parent's option, or use default option if it is the top Screen
- (UIViewController *)findChildVCForConfigAndTrait:(ABI44_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([self.presentedViewController isKindOfClass:[ABI44_0_0RNSScreen class]]) {
    lastViewController = self.presentedViewController;
    // we don't want to allow controlling of status bar appearance when we present non-fullScreen modal
    // and it is not possible if `modalPresentationCapturesStatusBarAppearance` is not set to YES, so even
    // if we went into a modal here and ask it, it wouldn't take any effect. For fullScreen modals, the system
    // asks them by itself, so we can stop traversing here.
    // for screen orientation, we need to start the search again from that modal
    return !includingModals
        ? nil
        : [(ABI44_0_0RNSScreen *)lastViewController findChildVCForConfigAndTrait:trait includingModals:includingModals]
            ?: lastViewController;
  }

  UIViewController *selfOrNil = [self hasTraitSet:trait] ? self : nil;
  if (lastViewController == nil) {
    return selfOrNil;
  } else {
    if ([lastViewController conformsToProtocol:@protocol(ABI44_0_0RNScreensViewControllerDelegate)]) {
      // If there is a child (should be VC of ScreenContainer or ScreenStack), that has a child that could provide the
      // trait, we recursively go into its findChildVCForConfig, and if one of the children has the trait set, we return
      // it, otherwise we return self if this VC has config, and nil if it doesn't we use
      // `childViewControllerForStatusBarStyle` for all options since the behavior is the same for all of them
      UIViewController *childScreen = [lastViewController childViewControllerForStatusBarStyle];
      if ([childScreen isKindOfClass:[ABI44_0_0RNSScreen class]]) {
        return [(ABI44_0_0RNSScreen *)childScreen findChildVCForConfigAndTrait:trait includingModals:includingModals]
            ?: selfOrNil;
      } else {
        return selfOrNil;
      }
    } else {
      // child vc is not from this library, so we don't ask it
      return selfOrNil;
    }
  }
}

- (BOOL)hasTraitSet:(ABI44_0_0RNSWindowTrait)trait
{
  switch (trait) {
    case ABI44_0_0RNSWindowTraitStyle: {
      return ((ABI44_0_0RNSScreenView *)self.view).hasStatusBarStyleSet;
    }
    case ABI44_0_0RNSWindowTraitAnimation: {
      return ((ABI44_0_0RNSScreenView *)self.view).hasStatusBarAnimationSet;
    }
    case ABI44_0_0RNSWindowTraitHidden: {
      return ((ABI44_0_0RNSScreenView *)self.view).hasStatusBarHiddenSet;
    }
    case ABI44_0_0RNSWindowTraitOrientation: {
      return ((ABI44_0_0RNSScreenView *)self.view).hasOrientationSet;
    }
    default: {
      ABI44_0_0RCTLogError(@"Unknown trait passed: %d", (int)trait);
    }
  }
  return NO;
}

#endif

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  // The below code makes the screen view adapt dimensions provided by the system. We take these
  // into account only when the view is mounted under ABI44_0_0RNScreensNavigationController in which case system
  // provides additional padding to account for possible header, and in the case when screen is
  // shown as a native modal, as the final dimensions of the modal on iOS 12+ are shorter than the
  // screen size
  BOOL isDisplayedWithinUINavController =
      [self.parentViewController isKindOfClass:[ABI44_0_0RNScreensNavigationController class]];
  BOOL isPresentedAsNativeModal = self.parentViewController == nil && self.presentingViewController != nil;
  if ((isDisplayedWithinUINavController || isPresentedAsNativeModal) &&
      !CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((ABI44_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
  }
}

- (id)findFirstResponder:(UIView *)parent
{
  if (parent.isFirstResponder) {
    return parent;
  }
  for (UIView *subView in parent.subviews) {
    id responder = [self findFirstResponder:subView];
    if (responder != nil) {
      return responder;
    }
  }
  return nil;
}

- (void)willMoveToParentViewController:(UIViewController *)parent
{
  [super willMoveToParentViewController:parent];
  if (parent == nil) {
    id responder = [self findFirstResponder:self.view];
    if (responder != nil) {
      _previousFirstResponder = responder;
    }
  }
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];

  if (!_isSwiping) {
    [((ABI44_0_0RNSScreenView *)self.view) notifyWillAppear];
    if (self.transitionCoordinator.isInteractive) {
      // we started dismissing with swipe gesture
      _isSwiping = YES;
    }
  } else {
    // this event is also triggered if we cancelled the swipe.
    // The _isSwiping is still true, but we don't want to notify then
    _shouldNotify = NO;
  }

  [self hideHeaderIfNecessary];

  // as per documentation of these methods
  _goingForward = [self isBeingPresented] || [self isMovingToParentViewController];

  [ABI44_0_0RNSScreenWindowTraits updateWindowTraits];
  if (_shouldNotify) {
    _closing = NO;
    [self notifyTransitionProgress:0.0 closing:_closing goingForward:_goingForward];
    [self setupProgressNotification];
  }
}

- (void)hideHeaderIfNecessary
{
#if !TARGET_OS_TV
  // On iOS >=13, there is a bug when user transitions from screen with active search bar to screen without header
  // In that case default iOS header will be shown. To fix this we hide header when the screens that appears has header
  // hidden and search bar was active on previous screen. We need to do it asynchronously, because default header is
  // added after viewWillAppear.
  if (@available(iOS 13.0, *)) {
    NSUInteger currentIndex = [self.navigationController.viewControllers indexOfObject:self];

    if (currentIndex > 0 && [self.view.ABI44_0_0ReactSubviews[0] isKindOfClass:[ABI44_0_0RNSScreenStackHeaderConfig class]]) {
      UINavigationItem *prevNavigationItem =
          [self.navigationController.viewControllers objectAtIndex:currentIndex - 1].navigationItem;
      ABI44_0_0RNSScreenStackHeaderConfig *config = ((ABI44_0_0RNSScreenStackHeaderConfig *)self.view.ABI44_0_0ReactSubviews[0]);

      BOOL wasSearchBarActive = prevNavigationItem.searchController.active;
      BOOL shouldHideHeader = config.hide;

      if (wasSearchBarActive && shouldHideHeader) {
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, 0);
        dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
          [self.navigationController setNavigationBarHidden:YES animated:NO];
        });
      }
    }
  }
#endif
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];

  if (!self.transitionCoordinator.isInteractive) {
    // user might have long pressed ios 14 back button item,
    // so he can go back more than one screen and we need to dismiss more screens in JS stack then.
    // We check it by calculating the difference between the index of currently displayed screen
    // and the index of the target screen, which is the view of topViewController at this point.
    // If the value is lower than 1, it means we are dismissing a modal, or navigating forward, or going back with JS.
    int selfIndex = [self getIndexOfView:self.view];
    int targetIndex = [self getIndexOfView:self.navigationController.topViewController.view];
    _dismissCount = selfIndex - targetIndex > 0 ? selfIndex - targetIndex : 1;
  } else {
    _dismissCount = 1;
  }

  // same flow as in viewWillAppear
  if (!_isSwiping) {
    [((ABI44_0_0RNSScreenView *)self.view) notifyWillDisappear];
    if (self.transitionCoordinator.isInteractive) {
      _isSwiping = YES;
    }
  } else {
    _shouldNotify = NO;
  }

  // as per documentation of these methods
  _goingForward = !([self isBeingDismissed] || [self isMovingFromParentViewController]);

  if (_shouldNotify) {
    _closing = YES;
    [self notifyTransitionProgress:0.0 closing:_closing goingForward:_goingForward];
    [self setupProgressNotification];
  }
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];

  if (!_isSwiping || _shouldNotify) {
    // we are going forward or dismissing without swipe
    // or successfully swiped back
    [((ABI44_0_0RNSScreenView *)self.view) notifyAppear];
    [self notifyTransitionProgress:1.0 closing:NO goingForward:_goingForward];
  }

  _isSwiping = NO;
  _shouldNotify = YES;
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];

  if (self.parentViewController == nil && self.presentingViewController == nil) {
    if (((ABI44_0_0RNSScreenView *)self.view).preventNativeDismiss) {
      // if we want to prevent the native dismiss, we do not send dismissal event,
      // but instead call `updateContainer`, which restores the JS navigation stack
      [((ABI44_0_0RNSScreenView *)self.view).ABI44_0_0ReactSuperview updateContainer];
      [((ABI44_0_0RNSScreenView *)self.view) notifyDismissCancelledWithDismissCount:_dismissCount];
    } else {
      // screen dismissed, send event
      [((ABI44_0_0RNSScreenView *)self.view) notifyDismissedWithCount:_dismissCount];
    }
  }

  // same flow as in viewDidAppear
  if (!_isSwiping || _shouldNotify) {
    [((ABI44_0_0RNSScreenView *)self.view) notifyDisappear];
    [self notifyTransitionProgress:1.0 closing:YES goingForward:_goingForward];
  }

  _isSwiping = NO;
  _shouldNotify = YES;

  [self traverseForScrollView:self.view];
}

- (void)traverseForScrollView:(UIView *)view
{
  if (![[self.view valueForKey:@"_bridge"] valueForKey:@"_jsThread"]) {
    // we don't want to send `scrollViewDidEndDecelerating` event to JS before the JS thread is ready
    return;
  }
  if ([view isKindOfClass:[UIScrollView class]] &&
      ([[(UIScrollView *)view delegate] respondsToSelector:@selector(scrollViewDidEndDecelerating:)])) {
    [[(UIScrollView *)view delegate] scrollViewDidEndDecelerating:(id)view];
  }
  [view.subviews enumerateObjectsUsingBlock:^(__kindof UIView *_Nonnull obj, NSUInteger idx, BOOL *_Nonnull stop) {
    [self traverseForScrollView:obj];
  }];
}

- (int)getIndexOfView:(UIView *)view
{
  return (int)[[self.view.ABI44_0_0ReactSuperview ABI44_0_0ReactSubviews] indexOfObject:view];
}

- (int)getParentChildrenCount
{
  return (int)[[self.view.ABI44_0_0ReactSuperview ABI44_0_0ReactSubviews] count];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
  // the correct Screen for appearance is set after the transition, same for orientation.
  [ABI44_0_0RNSScreenWindowTraits updateWindowTraits];
}

#pragma mark - transition progress related methods

- (void)setupProgressNotification
{
  if (self.transitionCoordinator != nil) {
    _fakeView.alpha = 0.0;
    [self.transitionCoordinator
        animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
          [[context containerView] addSubview:self->_fakeView];
          self->_fakeView.alpha = 1.0;
          self->_animationTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(handleAnimation)];
          [self->_animationTimer addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
        }
        completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
          [self->_animationTimer setPaused:YES];
          [self->_animationTimer invalidate];
          [self->_fakeView removeFromSuperview];
        }];
  }
}

- (void)handleAnimation
{
  if ([[_fakeView layer] presentationLayer] != nil) {
    CGFloat fakeViewAlpha = _fakeView.layer.presentationLayer.opacity;
    if (_currentAlpha != fakeViewAlpha) {
      _currentAlpha = fmax(0.0, fmin(1.0, fakeViewAlpha));
      [self notifyTransitionProgress:_currentAlpha closing:_closing goingForward:_goingForward];
    }
  }
}

- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward
{
  [((ABI44_0_0RNSScreenView *)self.view) notifyTransitionProgress:progress closing:closing goingForward:goingForward];
}

@end

@implementation ABI44_0_0RNSScreenManager

ABI44_0_0RCT_EXPORT_MODULE()

// we want to handle the case when activityState is nil
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(activityState, activityStateOrNil, NSNumber)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(customAnimationOnSwipe, BOOL);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(fullScreenSwipeEnabled, BOOL);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(preventNativeDismiss, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(replaceAnimation, ABI44_0_0RNSScreenReplaceAnimation)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI44_0_0RNSScreenStackPresentation)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI44_0_0RNSScreenStackAnimation)

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDisappear, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onNativeDismissCancelled, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onTransitionProgress, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onWillAppear, ABI44_0_0RCTDirectEventBlock);
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onWillDisappear, ABI44_0_0RCTDirectEventBlock);

#if !TARGET_OS_TV
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(screenOrientation, UIInterfaceOrientationMask)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarAnimation, UIStatusBarAnimation)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarHidden, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarStyle, ABI44_0_0RNSStatusBarStyle)
#endif

- (UIView *)view
{
  return [[ABI44_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI44_0_0RCTConvert (ABI44_0_0RNSScreen)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0RNSScreenStackPresentation,
    (@{
      @"push" : @(ABI44_0_0RNSScreenStackPresentationPush),
      @"modal" : @(ABI44_0_0RNSScreenStackPresentationModal),
      @"fullScreenModal" : @(ABI44_0_0RNSScreenStackPresentationFullScreenModal),
      @"formSheet" : @(ABI44_0_0RNSScreenStackPresentationFormSheet),
      @"containedModal" : @(ABI44_0_0RNSScreenStackPresentationContainedModal),
      @"transparentModal" : @(ABI44_0_0RNSScreenStackPresentationTransparentModal),
      @"containedTransparentModal" : @(ABI44_0_0RNSScreenStackPresentationContainedTransparentModal)
    }),
    ABI44_0_0RNSScreenStackPresentationPush,
    integerValue)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0RNSScreenStackAnimation,
    (@{
      @"default" : @(ABI44_0_0RNSScreenStackAnimationDefault),
      @"none" : @(ABI44_0_0RNSScreenStackAnimationNone),
      @"fade" : @(ABI44_0_0RNSScreenStackAnimationFade),
      @"fade_from_bottom" : @(ABI44_0_0RNSScreenStackAnimationFadeFromBottom),
      @"flip" : @(ABI44_0_0RNSScreenStackAnimationFlip),
      @"simple_push" : @(ABI44_0_0RNSScreenStackAnimationSimplePush),
      @"slide_from_bottom" : @(ABI44_0_0RNSScreenStackAnimationSlideFromBottom),
      @"slide_from_right" : @(ABI44_0_0RNSScreenStackAnimationDefault),
      @"slide_from_left" : @(ABI44_0_0RNSScreenStackAnimationDefault),
    }),
    ABI44_0_0RNSScreenStackAnimationDefault,
    integerValue)

ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0RNSScreenReplaceAnimation,
    (@{
      @"push" : @(ABI44_0_0RNSScreenReplaceAnimationPush),
      @"pop" : @(ABI44_0_0RNSScreenReplaceAnimationPop),
    }),
    ABI44_0_0RNSScreenReplaceAnimationPop,
    integerValue)

#if !TARGET_OS_TV
ABI44_0_0RCT_ENUM_CONVERTER(
    ABI44_0_0RNSStatusBarStyle,
    (@{
      @"auto" : @(ABI44_0_0RNSStatusBarStyleAuto),
      @"inverted" : @(ABI44_0_0RNSStatusBarStyleInverted),
      @"light" : @(ABI44_0_0RNSStatusBarStyleLight),
      @"dark" : @(ABI44_0_0RNSStatusBarStyleDark),
    }),
    ABI44_0_0RNSStatusBarStyleAuto,
    integerValue)

+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json
{
  json = [self NSString:json];
  if ([json isEqualToString:@"default"]) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if ([json isEqualToString:@"all"]) {
    return UIInterfaceOrientationMaskAll;
  } else if ([json isEqualToString:@"portrait"]) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if ([json isEqualToString:@"portrait_up"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([json isEqualToString:@"portrait_down"]) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if ([json isEqualToString:@"landscape"]) {
    return UIInterfaceOrientationMaskLandscape;
  } else if ([json isEqualToString:@"landscape_left"]) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if ([json isEqualToString:@"landscape_right"]) {
    return UIInterfaceOrientationMaskLandscapeRight;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}
#endif

@end
