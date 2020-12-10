#import <UIKit/UIKit.h>

#import "ABI40_0_0RNSScreen.h"
#import "ABI40_0_0RNSScreenStackHeaderConfig.h"
#import "ABI40_0_0RNSScreenContainer.h"

#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTShadowView.h>
#import <ABI40_0_0React/ABI40_0_0RCTTouchHandler.h>

@interface ABI40_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate, ABI40_0_0RCTInvalidating>
@end

@implementation ABI40_0_0RNSScreenView {
  __weak ABI40_0_0RCTBridge *_bridge;
  ABI40_0_0RNSScreen *_controller;
  ABI40_0_0RCTTouchHandler *_touchHandler;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI40_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI40_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI40_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI40_0_0RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _replaceAnimation = ABI40_0_0RNSScreenReplaceAnimationPop;
    _dismissed = NO;
  }

  return self;
}

- (void)ABI40_0_0ReactSetFrame:(CGRect)frame
{
  if (![self.ABI40_0_0ReactViewController.parentViewController
        isKindOfClass:[UINavigationController class]]) {
    [super ABI40_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore ABI40_0_0React layout system from managing
  // the screen dimentions and we wait for the screen VC to update and then we
  // pass the dimentions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)ABI40_0_0ReactViewController
{
  return _controller;
}

- (void)updateBounds
{
  [_bridge.uiManager setSize:self.bounds.size forView:self];
}

- (void)setActivityState:(int)activityState
{
  if (activityState != _activityState) {
    _activityState = activityState;
    [_ABI40_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI40_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI40_0_0React props
}

- (void)setStackPresentation:(ABI40_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI40_0_0RNSScreenStackPresentationModal:
#ifdef __IPHONE_13_0
      if (@available(iOS 13.0, *)) {
        _controller.modalPresentationStyle = UIModalPresentationAutomatic;
      } else {
        _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      }
#else
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
#endif
      break;
    case ABI40_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
#if (TARGET_OS_IOS)
    case ABI40_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
#endif
    case ABI40_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI40_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI40_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI40_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI40_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI40_0_0RNSScreenStackPresentationPush) {
    ABI40_0_0RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI40_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI40_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
#if (TARGET_OS_IOS)
    case ABI40_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
#endif
    case ABI40_0_0RNSScreenStackAnimationNone:
    case ABI40_0_0RNSScreenStackAnimationDefault:
      // Default
      break;
  }
}

- (void)setGestureEnabled:(BOOL)gestureEnabled
{
  #ifdef __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
      _controller.modalInPresentation = !gestureEnabled;
    }
  #endif

  _gestureEnabled = gestureEnabled;
}

- (void)setReplaceAnimation:(ABI40_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  _replaceAnimation = replaceAnimation;
}

- (UIView *)ABI40_0_0ReactSuperview
{
  return _ABI40_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI40_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI40_0_0RNSScreenStackHeaderConfig*) view).screenView = self;
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

- (BOOL)isMountedUnderScreenOrABI40_0_0ReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI40_0_0RCTRootView class]] || [parent isKindOfClass:[ABI40_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For ABI40_0_0RN touches to work we need to instantiate and connect ABI40_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI40_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrABI40_0_0ReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI40_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because ABI40_0_0RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI40_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI40_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

- (BOOL)presentationControllerShouldDismiss:(UIPresentationController *)presentationController
{
  return _gestureEnabled;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  if ([_ABI40_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI40_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation ABI40_0_0RNSScreen {
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

- (UIViewController *)childViewControllerForStatusBarStyle
{
  UIViewController *vc = [self findChildVCForConfig];
  return vc == self ? nil : vc;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  ABI40_0_0RNSScreenStackHeaderConfig *config = [self findScreenConfig];
  return [ABI40_0_0RNSScreenStackHeaderConfig statusBarStyleForRNSStatusBarStyle:config && config.statusBarStyle ? config.statusBarStyle : ABI40_0_0RNSStatusBarStyleAuto];
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  UIViewController *vc = [self findChildVCForConfig];
  return vc == self ? nil : vc;
}

- (BOOL)prefersStatusBarHidden
{
  ABI40_0_0RNSScreenStackHeaderConfig *config = [self findScreenConfig];
  return config && config.statusBarHidden ? config.statusBarHidden : NO;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  UIViewController *vc = [self findChildVCForConfig];
  if (vc != self && vc != nil) {
    return vc.preferredStatusBarUpdateAnimation;
  }
  
  ABI40_0_0RNSScreenStackHeaderConfig *config = [self findScreenConfig];
  return config && config.statusBarAnimation ? config.statusBarAnimation : UIStatusBarAnimationFade;
}

// if the returned vc is a child, it means that it can provide config;
// if the returned vc is self, it means that there is no child for config and self has config to provide,
// so we return self which results in asking self for preferredStatusBarStyle;
// if the returned vc is nil, it means none of children could provide config and self does not have config either,
// so if it was asked by parent, it will fallback to parent's option, or use default option if it is the top Screen
- (UIViewController *)findChildVCForConfig
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if (self.presentedViewController != nil) {
    lastViewController = self.presentedViewController;
    // setting this makes the modal vc being asked for appearance,
    // so it doesn't matter what we return here since the modal's root screen will be asked
    lastViewController.modalPresentationCapturesStatusBarAppearance = YES;
    return nil;
  }
  
  UIViewController *selfOrNil = [self findScreenConfig] != nil ? self : nil;
  if (lastViewController == nil) {
    return selfOrNil;
  } else {
    if ([lastViewController conformsToProtocol:@protocol(ABI40_0_0RNScreensViewControllerDelegate)]) {
      // If there is a child (should be VC of ScreenContainer or ScreenStack), that has a child that could provide config,
      // we recursively go into its findChildVCForConfig, and if one of the children has the config, we return it,
      // otherwise we return self if this VC has config, and nil if it doesn't
      // we use `childViewControllerForStatusBarStyle` for all options since the behavior is the same for all of them
      UIViewController *childScreen = [lastViewController childViewControllerForStatusBarStyle];
      if ([childScreen isKindOfClass:[ABI40_0_0RNSScreen class]]) {
        return [(ABI40_0_0RNSScreen *)childScreen findChildVCForConfig] ?: selfOrNil;
      } else {
        return selfOrNil;
      }
    } else {
      // child vc is not from this library, so we don't ask it
      return selfOrNil;
    }
  }
}

- (ABI40_0_0RNSScreenStackHeaderConfig *)findScreenConfig
{
  for (UIView *subview in self.view.ABI40_0_0ReactSubviews) {
    if ([subview isKindOfClass:[ABI40_0_0RNSScreenStackHeaderConfig class]]) {
      return (ABI40_0_0RNSScreenStackHeaderConfig *)subview;
    }
  }
  return nil;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (!CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((ABI40_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
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
  [ABI40_0_0RNSScreenStackHeaderConfig updateStatusBarAppearance];
  [((ABI40_0_0RNSScreenView *)self.view) notifyWillAppear];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];

  [((ABI40_0_0RNSScreenView *)self.view) notifyWillDisappear];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [((ABI40_0_0RNSScreenView *)self.view) notifyAppear];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];

  [((ABI40_0_0RNSScreenView *)self.view) notifyDisappear];
  if (self.parentViewController == nil && self.presentingViewController == nil) {
    // screen dismissed, send event
    [((ABI40_0_0RNSScreenView *)self.view) notifyDismissed];
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
  // the correct Screen for appearance is set after the transition
  [ABI40_0_0RNSScreenStackHeaderConfig updateStatusBarAppearance];
}

@end

@implementation ABI40_0_0RNSScreenManager

ABI40_0_0RCT_EXPORT_MODULE()

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(activityState, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(replaceAnimation, ABI40_0_0RNSScreenReplaceAnimation)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI40_0_0RNSScreenStackPresentation)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI40_0_0RNSScreenStackAnimation)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onWillAppear, ABI40_0_0RCTDirectEventBlock);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onWillDisappear, ABI40_0_0RCTDirectEventBlock);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI40_0_0RCTDirectEventBlock);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDisappear, ABI40_0_0RCTDirectEventBlock);
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI40_0_0RCTDirectEventBlock);

- (UIView *)view
{
  return [[ABI40_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI40_0_0RCTConvert (ABI40_0_0RNSScreen)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0RNSScreenStackPresentation, (@{
                                                  @"push": @(ABI40_0_0RNSScreenStackPresentationPush),
                                                  @"modal": @(ABI40_0_0RNSScreenStackPresentationModal),
                                                  @"fullScreenModal": @(ABI40_0_0RNSScreenStackPresentationFullScreenModal),
                                                  @"formSheet": @(ABI40_0_0RNSScreenStackPresentationFormSheet),
                                                  @"containedModal": @(ABI40_0_0RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(ABI40_0_0RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(ABI40_0_0RNSScreenStackPresentationContainedTransparentModal)
                                                  }), ABI40_0_0RNSScreenStackPresentationPush, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0RNSScreenStackAnimation, (@{
                                                  @"default": @(ABI40_0_0RNSScreenStackAnimationDefault),
                                                  @"none": @(ABI40_0_0RNSScreenStackAnimationNone),
                                                  @"fade": @(ABI40_0_0RNSScreenStackAnimationFade),
                                                  @"flip": @(ABI40_0_0RNSScreenStackAnimationFlip),
                                                  }), ABI40_0_0RNSScreenStackAnimationDefault, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0RNSScreenReplaceAnimation, (@{
                                                  @"push": @(ABI40_0_0RNSScreenReplaceAnimationPush),
                                                  @"pop": @(ABI40_0_0RNSScreenReplaceAnimationPop),
                                                  }), ABI40_0_0RNSScreenReplaceAnimationPop, integerValue)

@end
