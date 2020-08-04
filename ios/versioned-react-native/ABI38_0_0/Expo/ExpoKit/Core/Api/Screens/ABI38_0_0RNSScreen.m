#import <UIKit/UIKit.h>

#import "ABI38_0_0RNSScreen.h"
#import "ABI38_0_0RNSScreenContainer.h"
#import "ABI38_0_0RNSScreenStackHeaderConfig.h"

#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTShadowView.h>
#import <ABI38_0_0React/ABI38_0_0RCTTouchHandler.h>

@interface ABI38_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate, ABI38_0_0RCTInvalidating>
@end

@implementation ABI38_0_0RNSScreenView {
  __weak ABI38_0_0RCTBridge *_bridge;
  ABI38_0_0RNSScreen *_controller;
  ABI38_0_0RCTTouchHandler *_touchHandler;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI38_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI38_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI38_0_0RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _dismissed = NO;
  }

  return self;
}

- (void)ABI38_0_0ReactSetFrame:(CGRect)frame
{
  if (![self.ABI38_0_0ReactViewController.parentViewController
        isKindOfClass:[UINavigationController class]]) {
    [super ABI38_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore ABI38_0_0React layout system from managing
  // the screen dimentions and we wait for the screen VC to update and then we
  // pass the dimentions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)ABI38_0_0ReactViewController
{
  return _controller;
}

- (void)updateBounds
{
  [_bridge.uiManager setSize:self.bounds.size forView:self];
}

- (void)setActive:(BOOL)active
{
  if (active != _active) {
    _active = active;
    [_ABI38_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI38_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI38_0_0React props
}

- (void)setStackPresentation:(ABI38_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI38_0_0RNSScreenStackPresentationModal:
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
    case ABI38_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
    case ABI38_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
    case ABI38_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI38_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI38_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI38_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI38_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI38_0_0RNSScreenStackPresentationPush) {
    ABI38_0_0RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI38_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI38_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
    case ABI38_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
    case ABI38_0_0RNSScreenStackAnimationNone:
    case ABI38_0_0RNSScreenStackAnimationDefault:
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

- (UIView *)ABI38_0_0ReactSuperview
{
  return _ABI38_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI38_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI38_0_0RNSScreenStackHeaderConfig*) view).screenView = self;
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

- (BOOL)isMountedUnderScreenOrABI38_0_0ReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI38_0_0RCTRootView class]] || [parent isKindOfClass:[ABI38_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For ABI38_0_0RN touches to work we need to instantiate and connect ABI38_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI38_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrABI38_0_0ReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI38_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because ABI38_0_0RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI38_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI38_0_0RCTTouchHanler to dispatch cancel event.
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
  if ([_ABI38_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI38_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation ABI38_0_0RNSScreen {
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

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (!CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((ABI38_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
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

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  if (self.parentViewController == nil && self.presentingViewController == nil) {
    // screen dismissed, send event
    [((ABI38_0_0RNSScreenView *)self.view) notifyDismissed];
  }
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [((ABI38_0_0RNSScreenView *)self.view) notifyAppear];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

@end

@implementation ABI38_0_0RNSScreenManager

ABI38_0_0RCT_EXPORT_MODULE()

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(active, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI38_0_0RNSScreenStackPresentation)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI38_0_0RNSScreenStackAnimation)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI38_0_0RCTDirectEventBlock);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI38_0_0RCTDirectEventBlock);

- (UIView *)view
{
  return [[ABI38_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI38_0_0RCTConvert (ABI38_0_0RNSScreen)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0RNSScreenStackPresentation, (@{
                                                  @"push": @(ABI38_0_0RNSScreenStackPresentationPush),
                                                  @"modal": @(ABI38_0_0RNSScreenStackPresentationModal),
                                                  @"fullScreenModal": @(ABI38_0_0RNSScreenStackPresentationFullScreenModal),
                                                  @"formSheet": @(ABI38_0_0RNSScreenStackPresentationFormSheet),
                                                  @"containedModal": @(ABI38_0_0RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(ABI38_0_0RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(ABI38_0_0RNSScreenStackPresentationContainedTransparentModal)
                                                  }), ABI38_0_0RNSScreenStackPresentationPush, integerValue)

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0RNSScreenStackAnimation, (@{
                                                  @"default": @(ABI38_0_0RNSScreenStackAnimationDefault),
                                                  @"none": @(ABI38_0_0RNSScreenStackAnimationNone),
                                                  @"fade": @(ABI38_0_0RNSScreenStackAnimationFade),
                                                  @"flip": @(ABI38_0_0RNSScreenStackAnimationFlip),
                                                  }), ABI38_0_0RNSScreenStackAnimationDefault, integerValue)


@end

