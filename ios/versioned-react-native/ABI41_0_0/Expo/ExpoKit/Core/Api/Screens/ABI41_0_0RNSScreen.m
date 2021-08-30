#import <UIKit/UIKit.h>

#import "ABI41_0_0RNSScreen.h"
#import "ABI41_0_0RNSScreenStackHeaderConfig.h"
#import "ABI41_0_0RNSScreenContainer.h"

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTShadowView.h>
#import <ABI41_0_0React/ABI41_0_0RCTTouchHandler.h>

@interface ABI41_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate, ABI41_0_0RCTInvalidating>
@end

@implementation ABI41_0_0RNSScreenView {
  __weak ABI41_0_0RCTBridge *_bridge;
  ABI41_0_0RNSScreen *_controller;
  ABI41_0_0RCTTouchHandler *_touchHandler;
  CGRect _ABI41_0_0ReactFrame;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI41_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI41_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI41_0_0RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _replaceAnimation = ABI41_0_0RNSScreenReplaceAnimationPop;
    _dismissed = NO;
  }

  return self;
}

- (void)ABI41_0_0ReactSetFrame:(CGRect)frame
{
  _ABI41_0_0ReactFrame = frame;
  UIViewController *parentVC = self.ABI41_0_0ReactViewController.parentViewController;
  if (parentVC != nil && ![parentVC isKindOfClass:[UINavigationController class]]) {
    [super ABI41_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore ABI41_0_0React layout system from managing
  // the screen dimensions and we wait for the screen VC to update and then we
  // pass the dimensions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)ABI41_0_0ReactViewController
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
    [_ABI41_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI41_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI41_0_0React props
}

- (void)setStackPresentation:(ABI41_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI41_0_0RNSScreenStackPresentationModal:
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
    case ABI41_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
#if !TARGET_OS_TV
    case ABI41_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
#endif
    case ABI41_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI41_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI41_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI41_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI41_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI41_0_0RNSScreenStackPresentationPush) {
    ABI41_0_0RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI41_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI41_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
#if !TARGET_OS_TV
    case ABI41_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
#endif
    case ABI41_0_0RNSScreenStackAnimationNone:
    case ABI41_0_0RNSScreenStackAnimationDefault:
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

- (void)setReplaceAnimation:(ABI41_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  _replaceAnimation = replaceAnimation;
}

- (UIView *)ABI41_0_0ReactSuperview
{
  return _ABI41_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI41_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI41_0_0RNSScreenStackHeaderConfig*) view).screenView = self;
  }
}

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyDismissed
{
  _dismissed = YES;
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(nil);
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
  [self ABI41_0_0ReactSetFrame:_ABI41_0_0ReactFrame];
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

- (BOOL)isMountedUnderScreenOrABI41_0_0ReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI41_0_0RCTRootView class]] || [parent isKindOfClass:[ABI41_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For ABI41_0_0RN touches to work we need to instantiate and connect ABI41_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI41_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrABI41_0_0ReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI41_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because ABI41_0_0RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI41_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI41_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

- (ABI41_0_0RCTTouchHandler *)touchHandler
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
  if ([_ABI41_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI41_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation ABI41_0_0RNSScreen {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    self.view = view;
  }
  return self;
}

#if !TARGET_OS_TV
- (UIViewController *)childViewControllerForStatusBarStyle
{
  UIViewController *vc = [self findChildVCForConfigIncludingModals:NO];
  return vc == self ? nil : vc;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  ABI41_0_0RNSScreenStackHeaderConfig *config = [self findScreenConfig];
  return [ABI41_0_0RNSScreenStackHeaderConfig statusBarStyleForRNSStatusBarStyle:config && config.statusBarStyle ? config.statusBarStyle : ABI41_0_0RNSStatusBarStyleAuto];
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  UIViewController *vc = [self findChildVCForConfigIncludingModals:NO];
  return vc == self ? nil : vc;
}

- (BOOL)prefersStatusBarHidden
{
  ABI41_0_0RNSScreenStackHeaderConfig *config = [self findScreenConfig];
  return config && config.statusBarHidden ? config.statusBarHidden : NO;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  UIViewController *vc = [self findChildVCForConfigIncludingModals:NO];
  
  if ([vc isKindOfClass:[ABI41_0_0RNSScreen class]]) {
    ABI41_0_0RNSScreenStackHeaderConfig *config = [(ABI41_0_0RNSScreen *)vc findScreenConfig];
    return config && config.statusBarAnimation ? config.statusBarAnimation : UIStatusBarAnimationFade;
  }
  return UIStatusBarAnimationFade;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIViewController *vc = [self findChildVCForConfigIncludingModals:YES];

  if ([vc isKindOfClass:[ABI41_0_0RNSScreen class]]) {
    ABI41_0_0RNSScreenStackHeaderConfig *config = [(ABI41_0_0RNSScreen *)vc findScreenConfig];
    return config && config.screenOrientation ? config.screenOrientation : UIInterfaceOrientationMaskAllButUpsideDown;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

// if the returned vc is a child, it means that it can provide config;
// if the returned vc is self, it means that there is no child for config and self has config to provide,
// so we return self which results in asking self for preferredStatusBarStyle/Animation etc.;
// if the returned vc is nil, it means none of children could provide config and self does not have config either,
// so if it was asked by parent, it will fallback to parent's option, or use default option if it is the top Screen
- (UIViewController *)findChildVCForConfigIncludingModals:(BOOL)includingModals
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([self.presentedViewController isKindOfClass:[ABI41_0_0RNSScreen class]]) {
    lastViewController = self.presentedViewController;
    // we don't want to allow controlling of status bar appearance when we present non-fullScreen modal
    // and it is not possible if `modalPresentationCapturesStatusBarAppearance` is not set to YES, so even
    // if we went into a modal here and ask it, it wouldn't take any effect. For fullScreen modals, the system
    // asks them by itself, so we can stop traversing here.
    // for screen orientation, we need to start the search again from that modal
    return !includingModals ? nil : [(ABI41_0_0RNSScreen *)lastViewController findChildVCForConfigIncludingModals:includingModals] ?: lastViewController;
  }

  UIViewController *selfOrNil = [self findScreenConfig] != nil ? self : nil;
  if (lastViewController == nil) {
    return selfOrNil;
  } else {
    if ([lastViewController conformsToProtocol:@protocol(ABI41_0_0RNScreensViewControllerDelegate)]) {
      // If there is a child (should be VC of ScreenContainer or ScreenStack), that has a child that could provide config,
      // we recursively go into its findChildVCForConfig, and if one of the children has the config, we return it,
      // otherwise we return self if this VC has config, and nil if it doesn't
      // we use `childViewControllerForStatusBarStyle` for all options since the behavior is the same for all of them
      UIViewController *childScreen = [lastViewController childViewControllerForStatusBarStyle];
      if ([childScreen isKindOfClass:[ABI41_0_0RNSScreen class]]) {
        return [(ABI41_0_0RNSScreen *)childScreen findChildVCForConfigIncludingModals:includingModals] ?: selfOrNil;
      } else {
        return selfOrNil;
      }
    } else {
      // child vc is not from this library, so we don't ask it
      return selfOrNil;
    }
  }
}
#endif

- (ABI41_0_0RNSScreenStackHeaderConfig *)findScreenConfig
{
  for (UIView *subview in self.view.ABI41_0_0ReactSubviews) {
    if ([subview isKindOfClass:[ABI41_0_0RNSScreenStackHeaderConfig class]]) {
      return (ABI41_0_0RNSScreenStackHeaderConfig *)subview;
    }
  }
  return nil;
}

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
    [((ABI41_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
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
  [ABI41_0_0RNSScreenStackHeaderConfig updateWindowTraits];
  [((ABI41_0_0RNSScreenView *)self.view) notifyWillAppear];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];

  [((ABI41_0_0RNSScreenView *)self.view) notifyWillDisappear];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [((ABI41_0_0RNSScreenView *)self.view) notifyAppear];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];

  [((ABI41_0_0RNSScreenView *)self.view) notifyDisappear];
  if (self.parentViewController == nil && self.presentingViewController == nil) {
    // screen dismissed, send event
    [((ABI41_0_0RNSScreenView *)self.view) notifyDismissed];
  }
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
  [ABI41_0_0RNSScreenStackHeaderConfig updateWindowTraits];
}

@end

@implementation ABI41_0_0RNSScreenManager

ABI41_0_0RCT_EXPORT_MODULE()

// we want to handle the case when activityState is nil
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(activityState, activityStateOrNil, NSNumber)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(replaceAnimation, ABI41_0_0RNSScreenReplaceAnimation)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI41_0_0RNSScreenStackPresentation)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI41_0_0RNSScreenStackAnimation)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onWillAppear, ABI41_0_0RCTDirectEventBlock);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onWillDisappear, ABI41_0_0RCTDirectEventBlock);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI41_0_0RCTDirectEventBlock);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDisappear, ABI41_0_0RCTDirectEventBlock);
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI41_0_0RCTDirectEventBlock);

- (UIView *)view
{
  return [[ABI41_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI41_0_0RCTConvert (ABI41_0_0RNSScreen)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RNSScreenStackPresentation, (@{
                                                  @"push": @(ABI41_0_0RNSScreenStackPresentationPush),
                                                  @"modal": @(ABI41_0_0RNSScreenStackPresentationModal),
                                                  @"fullScreenModal": @(ABI41_0_0RNSScreenStackPresentationFullScreenModal),
                                                  @"formSheet": @(ABI41_0_0RNSScreenStackPresentationFormSheet),
                                                  @"containedModal": @(ABI41_0_0RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(ABI41_0_0RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(ABI41_0_0RNSScreenStackPresentationContainedTransparentModal)
                                                  }), ABI41_0_0RNSScreenStackPresentationPush, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RNSScreenStackAnimation, (@{
                                                  @"default": @(ABI41_0_0RNSScreenStackAnimationDefault),
                                                  @"none": @(ABI41_0_0RNSScreenStackAnimationNone),
                                                  @"fade": @(ABI41_0_0RNSScreenStackAnimationFade),
                                                  @"flip": @(ABI41_0_0RNSScreenStackAnimationFlip),
                                                  @"slide_from_right": @(ABI41_0_0RNSScreenStackAnimationDefault),
                                                  @"slide_from_left": @(ABI41_0_0RNSScreenStackAnimationDefault),
                                                  }), ABI41_0_0RNSScreenStackAnimationDefault, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RNSScreenReplaceAnimation, (@{
                                                  @"push": @(ABI41_0_0RNSScreenReplaceAnimationPush),
                                                  @"pop": @(ABI41_0_0RNSScreenReplaceAnimationPop),
                                                  }), ABI41_0_0RNSScreenReplaceAnimationPop, integerValue)

@end
