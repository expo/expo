#import <UIKit/UIKit.h>

#import "ABI42_0_0RNSScreen.h"
#import "ABI42_0_0RNSScreenStackHeaderConfig.h"
#import "ABI42_0_0RNSScreenContainer.h"
#import "ABI42_0_0RNSScreenStack.h"
#import "ABI42_0_0RNSScreenWindowTraits.h"

#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTShadowView.h>
#import <ABI42_0_0React/ABI42_0_0RCTTouchHandler.h>

@interface ABI42_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate, ABI42_0_0RCTInvalidating>
@end

@implementation ABI42_0_0RNSScreenView {
  __weak ABI42_0_0RCTBridge *_bridge;
  ABI42_0_0RNSScreen *_controller;
  ABI42_0_0RCTTouchHandler *_touchHandler;
  CGRect _reactFrame;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI42_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI42_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI42_0_0RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _replaceAnimation = ABI42_0_0RNSScreenReplaceAnimationPop;
    _dismissed = NO;
    _hasStatusBarStyleSet = NO;
    _hasStatusBarAnimationSet = NO;
    _hasStatusBarHiddenSet = NO;
    _hasOrientationSet = NO;
  }

  return self;
}

- (void)ABI42_0_0ReactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  UIViewController *parentVC = self.ABI42_0_0ReactViewController.parentViewController;
  if (parentVC != nil && ![parentVC isKindOfClass:[UINavigationController class]]) {
    [super ABI42_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimensions and we wait for the screen VC to update and then we
  // pass the dimensions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)ABI42_0_0ReactViewController
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
    [_ABI42_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI42_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI42_0_0React props
}

- (void)setStackPresentation:(ABI42_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI42_0_0RNSScreenStackPresentationModal:
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
      if (@available(iOS 13.0, *)) {
        _controller.modalPresentationStyle = UIModalPresentationAutomatic;
      } else {
        _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      }
#else
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
#endif
      break;
    case ABI42_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
#if !TARGET_OS_TV
    case ABI42_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
#endif
    case ABI42_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI42_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI42_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI42_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI42_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI42_0_0RNSScreenStackPresentationPush) {
    ABI42_0_0RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI42_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI42_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
#if !TARGET_OS_TV
    case ABI42_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
#endif
    case ABI42_0_0RNSScreenStackAnimationNone:
    case ABI42_0_0RNSScreenStackAnimationDefault:
    case ABI42_0_0RNSScreenStackAnimationSimplePush:
    case ABI42_0_0RNSScreenStackAnimationSlideFromBottom:
      // Default
      break;
  }
}

- (void)setGestureEnabled:(BOOL)gestureEnabled
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    _controller.modalInPresentation = !gestureEnabled;
  }
#endif

  _gestureEnabled = gestureEnabled;
}

- (void)setReplaceAnimation:(ABI42_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  _replaceAnimation = replaceAnimation;
}

#if !TARGET_OS_TV
- (void)setStatusBarStyle:(ABI42_0_0RNSStatusBarStyle)statusBarStyle
{
  _hasStatusBarStyleSet = YES;
  _statusBarStyle = statusBarStyle;
  [ABI42_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI42_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setStatusBarAnimation:(UIStatusBarAnimation)statusBarAnimation
{
  _hasStatusBarAnimationSet = YES;
  _statusBarAnimation = statusBarAnimation;
  [ABI42_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
}

- (void)setStatusBarHidden:(BOOL)statusBarHidden
{
  _hasStatusBarHiddenSet = YES;
  _statusBarHidden = statusBarHidden;
  [ABI42_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI42_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setScreenOrientation:(UIInterfaceOrientationMask)screenOrientation
{
  _hasOrientationSet = YES;
  _screenOrientation = screenOrientation;
  [ABI42_0_0RNSScreenWindowTraits enforceDesiredDeviceOrientation];
}
#endif

- (UIView *)ABI42_0_0ReactSuperview
{
  return _ABI42_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI42_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI42_0_0RNSScreenStackHeaderConfig*) view).screenView = self;
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
        self.onDismissed(@{@"dismissCount": @(dismissCount)});
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
  [self ABI42_0_0ReactSetFrame:_reactFrame];
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

- (BOOL)isMountedUnderScreenOrReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI42_0_0RCTRootView class]] || [parent isKindOfClass:[ABI42_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect ABI42_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI42_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI42_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
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
  // Because of that, at the moment when this method gets called the ABI42_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI42_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

- (ABI42_0_0RCTTouchHandler *)touchHandler
{
  if (_touchHandler != nil) {
    return _touchHandler;
  }
  UIView *parent = [self superview];
  while (parent != nil && ![parent respondsToSelector:@selector(touchHandler)]) parent = parent.superview;
  if (parent != nil) {
    return [parent performSelector:@selector(touchHandler)];
  }
  return nil;
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  return _gestureEnabled;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_ABI42_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI42_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation ABI42_0_0RNSScreen {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
  int _dismissCount;
  BOOL _isSwiping;
  BOOL _shouldNotify;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    self.view = view;
    _shouldNotify = YES;
  }
  return self;
}

#if !TARGET_OS_TV
- (UIViewController *)childViewControllerForStatusBarStyle
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI42_0_0RNSWindowTraitStyle includingModals:NO];
  return vc == self ? nil : vc;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [ABI42_0_0RNSScreenWindowTraits statusBarStyleForRNSStatusBarStyle:((ABI42_0_0RNSScreenView *)self.view).statusBarStyle];
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI42_0_0RNSWindowTraitHidden includingModals:NO];
  return vc == self ? nil : vc;
}

- (BOOL)prefersStatusBarHidden
{
  return ((ABI42_0_0RNSScreenView *)self.view).statusBarHidden;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI42_0_0RNSWindowTraitAnimation includingModals:NO];

  if ([vc isKindOfClass:[ABI42_0_0RNSScreen class]]) {
    return ((ABI42_0_0RNSScreenView *)vc.view).statusBarAnimation;
  }
  return UIStatusBarAnimationFade;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI42_0_0RNSWindowTraitOrientation includingModals:YES];

  if ([vc isKindOfClass:[ABI42_0_0RNSScreen class]]) {
    return ((ABI42_0_0RNSScreenView *)vc.view).screenOrientation;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

// if the returned vc is a child, it means that it can provide config;
// if the returned vc is self, it means that there is no child for config and self has config to provide,
// so we return self which results in asking self for preferredStatusBarStyle/Animation etc.;
// if the returned vc is nil, it means none of children could provide config and self does not have config either,
// so if it was asked by parent, it will fallback to parent's option, or use default option if it is the top Screen
- (UIViewController *)findChildVCForConfigAndTrait:(ABI42_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([self.presentedViewController isKindOfClass:[ABI42_0_0RNSScreen class]]) {
    lastViewController = self.presentedViewController;
    // we don't want to allow controlling of status bar appearance when we present non-fullScreen modal
    // and it is not possible if `modalPresentationCapturesStatusBarAppearance` is not set to YES, so even
    // if we went into a modal here and ask it, it wouldn't take any effect. For fullScreen modals, the system
    // asks them by itself, so we can stop traversing here.
    // for screen orientation, we need to start the search again from that modal
    return !includingModals ? nil : [(ABI42_0_0RNSScreen *)lastViewController findChildVCForConfigAndTrait:trait includingModals:includingModals] ?: lastViewController;
  }

  UIViewController *selfOrNil = [self hasTraitSet:trait] ? self : nil;
  if (lastViewController == nil) {
    return selfOrNil;
  } else {
    if ([lastViewController conformsToProtocol:@protocol(ABI42_0_0RNScreensViewControllerDelegate)]) {
      // If there is a child (should be VC of ScreenContainer or ScreenStack), that has a child that could provide the trait,
      // we recursively go into its findChildVCForConfig, and if one of the children has the trait set, we return it,
      // otherwise we return self if this VC has config, and nil if it doesn't
      // we use `childViewControllerForStatusBarStyle` for all options since the behavior is the same for all of them
      UIViewController *childScreen = [lastViewController childViewControllerForStatusBarStyle];
      if ([childScreen isKindOfClass:[ABI42_0_0RNSScreen class]]) {
        return [(ABI42_0_0RNSScreen *)childScreen findChildVCForConfigAndTrait:trait includingModals:includingModals] ?: selfOrNil;
      } else {
        return selfOrNil;
      }
    } else {
      // child vc is not from this library, so we don't ask it
      return selfOrNil;
    }
  }
}

- (BOOL)hasTraitSet:(ABI42_0_0RNSWindowTrait)trait
{
  switch (trait) {
    case ABI42_0_0RNSWindowTraitStyle: {
      return ((ABI42_0_0RNSScreenView *)self.view).hasStatusBarStyleSet;
    }
    case ABI42_0_0RNSWindowTraitAnimation: {
      return ((ABI42_0_0RNSScreenView *)self.view).hasStatusBarAnimationSet;
    }
    case ABI42_0_0RNSWindowTraitHidden: {
      return ((ABI42_0_0RNSScreenView *)self.view).hasStatusBarHiddenSet;
    }
    case ABI42_0_0RNSWindowTraitOrientation: {
      return ((ABI42_0_0RNSScreenView *)self.view).hasOrientationSet;
    }
    default: {
      ABI42_0_0RCTLogError(@"Unknown trait passed: %d", (int)trait);
    }
  }
  return NO;
}

#endif

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  // The below code makes the screen view adapt dimensions provided by the system. We take these
  // into account only when the view is mounted under UINavigationController in which case system
  // provides additional padding to account for possible header, and in the case when screen is
  // shown as a native modal, as the final dimensions of the modal on iOS 12+ are shorter than the
  // screen size
  BOOL isDisplayedWithinUINavController = [self.parentViewController isKindOfClass:[UINavigationController class]];
  BOOL isPresentedAsNativeModal = self.parentViewController == nil && self.presentingViewController != nil;
  if ((isDisplayedWithinUINavController || isPresentedAsNativeModal) && !CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((ABI42_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
  }
}

- (id)findFirstResponder:(UIView*)parent
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
    [((ABI42_0_0RNSScreenView *)self.view) notifyWillAppear];
    if (self.transitionCoordinator.isInteractive) {
      // we started dismissing with swipe gesture
      _isSwiping = YES;
    }
  } else {
    // this event is also triggered if we cancelled the swipe.
    // The _isSwiping is still true, but we don't want to notify then
    _shouldNotify = NO;
  }

  [ABI42_0_0RNSScreenWindowTraits updateWindowTraits];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];

  if (!self.transitionCoordinator.isInteractive) {
    // user might have long pressed ios 14 back button item,
    // so he can go back more than one screen and we need to dismiss more screens in JS stack then.
    // We calculate it by substracting the difference between the index of currently displayed screen
    // and the index of the target screen, which is the view of topViewController at this point.
    // If the value is lower than 1, it means we are navigating forward
    int selfIndex = (int)[[(ABI42_0_0RNSScreenStackView *) self.navigationController.delegate ABI42_0_0ReactSubviews] indexOfObject:self.view];
    int targetIndex = (int)[[(ABI42_0_0RNSScreenStackView *) self.navigationController.delegate ABI42_0_0ReactSubviews] indexOfObject:self.navigationController.topViewController.view];
    _dismissCount = selfIndex - targetIndex > 0 ? selfIndex - targetIndex : 1;

  } else {
    _dismissCount = 1;
  }

  // same flow as in viewWillAppear
  if (!_isSwiping) {
    [((ABI42_0_0RNSScreenView *)self.view) notifyWillDisappear];
    if (self.transitionCoordinator.isInteractive) {
      _isSwiping = YES;
    }
  } else {
    _shouldNotify = NO;
  }
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];

  if (!_isSwiping || _shouldNotify) {
    // we are going forward or dismissing without swipe
    // or successfully swiped back
    [((ABI42_0_0RNSScreenView *)self.view) notifyAppear];
  }

  _isSwiping = NO;
  _shouldNotify = YES;
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];

  if (self.parentViewController == nil && self.presentingViewController == nil) {
    // screen dismissed, send event
    [((ABI42_0_0RNSScreenView *)self.view) notifyDismissedWithCount:_dismissCount];
  }
  
  // same flow as in viewDidAppear
  if (!_isSwiping || _shouldNotify) {
    [((ABI42_0_0RNSScreenView *)self.view) notifyDisappear];
  }
  
  _isSwiping = NO;
  _shouldNotify = YES;

  [self traverseForScrollView:self.view];
}

- (void)traverseForScrollView:(UIView*)view
{
  if([view isKindOfClass:[UIScrollView class]] && ([[(UIScrollView*)view delegate] respondsToSelector:@selector(scrollViewDidEndDecelerating:)]) ) {
    [[(UIScrollView*)view delegate] scrollViewDidEndDecelerating:(id)view];
  }
  [view.subviews enumerateObjectsUsingBlock:^(__kindof UIView * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    [self traverseForScrollView:obj];
  }];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
  // the correct Screen for appearance is set after the transition, same for orientation.
  [ABI42_0_0RNSScreenWindowTraits updateWindowTraits];
}

@end

@implementation ABI42_0_0RNSScreenManager

ABI42_0_0RCT_EXPORT_MODULE()

// we want to handle the case when activityState is nil
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(activityState, activityStateOrNil, NSNumber)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(replaceAnimation, ABI42_0_0RNSScreenReplaceAnimation)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI42_0_0RNSScreenStackPresentation)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI42_0_0RNSScreenStackAnimation)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onWillAppear, ABI42_0_0RCTDirectEventBlock);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onWillDisappear, ABI42_0_0RCTDirectEventBlock);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI42_0_0RCTDirectEventBlock);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDisappear, ABI42_0_0RCTDirectEventBlock);
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI42_0_0RCTDirectEventBlock);

#if !TARGET_OS_TV
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(screenOrientation, UIInterfaceOrientationMask)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarStyle, ABI42_0_0RNSStatusBarStyle)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarAnimation, UIStatusBarAnimation)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarHidden, BOOL)
#endif

- (UIView *)view
{
  return [[ABI42_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI42_0_0RCTConvert (ABI42_0_0RNSScreen)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RNSScreenStackPresentation, (@{
                                                  @"push": @(ABI42_0_0RNSScreenStackPresentationPush),
                                                  @"modal": @(ABI42_0_0RNSScreenStackPresentationModal),
                                                  @"fullScreenModal": @(ABI42_0_0RNSScreenStackPresentationFullScreenModal),
                                                  @"formSheet": @(ABI42_0_0RNSScreenStackPresentationFormSheet),
                                                  @"containedModal": @(ABI42_0_0RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(ABI42_0_0RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(ABI42_0_0RNSScreenStackPresentationContainedTransparentModal)
                                                  }), ABI42_0_0RNSScreenStackPresentationPush, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RNSScreenStackAnimation, (@{
                                                  @"default": @(ABI42_0_0RNSScreenStackAnimationDefault),
                                                  @"none": @(ABI42_0_0RNSScreenStackAnimationNone),
                                                  @"fade": @(ABI42_0_0RNSScreenStackAnimationFade),
                                                  @"flip": @(ABI42_0_0RNSScreenStackAnimationFlip),
                                                  @"simple_push": @(ABI42_0_0RNSScreenStackAnimationSimplePush),
                                                  @"slide_from_bottom": @(ABI42_0_0RNSScreenStackAnimationSlideFromBottom),
                                                  @"slide_from_right": @(ABI42_0_0RNSScreenStackAnimationDefault),
                                                  @"slide_from_left": @(ABI42_0_0RNSScreenStackAnimationDefault),
                                                  }), ABI42_0_0RNSScreenStackAnimationDefault, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RNSScreenReplaceAnimation, (@{
                                                  @"push": @(ABI42_0_0RNSScreenReplaceAnimationPush),
                                                  @"pop": @(ABI42_0_0RNSScreenReplaceAnimationPop),
                                                  }), ABI42_0_0RNSScreenReplaceAnimationPop, integerValue)

#if !TARGET_OS_TV
ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RNSStatusBarStyle, (@{
  @"auto": @(ABI42_0_0RNSStatusBarStyleAuto),
  @"inverted": @(ABI42_0_0RNSStatusBarStyleInverted),
  @"light": @(ABI42_0_0RNSStatusBarStyleLight),
  @"dark": @(ABI42_0_0RNSStatusBarStyleDark),
  }), ABI42_0_0RNSStatusBarStyleAuto, integerValue)

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
