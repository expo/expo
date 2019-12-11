#import <UIKit/UIKit.h>

#import "ABI36_0_0RNSScreen.h"
#import "ABI36_0_0RNSScreenContainer.h"
#import "ABI36_0_0RNSScreenStackHeaderConfig.h"

#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTShadowView.h>
#import <ABI36_0_0React/ABI36_0_0RCTTouchHandler.h>

@interface ABI36_0_0RNSScreenView () <UIAdaptivePresentationControllerDelegate>
@end

@implementation ABI36_0_0RNSScreenView {
  __weak ABI36_0_0RCTBridge *_bridge;
  ABI36_0_0RNSScreen *_controller;
  ABI36_0_0RCTTouchHandler *_touchHandler;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(ABI36_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[ABI36_0_0RNSScreen alloc] initWithView:self];
    _stackPresentation = ABI36_0_0RNSScreenStackPresentationPush;
    _stackAnimation = ABI36_0_0RNSScreenStackAnimationDefault;
  }

  return self;
}

- (void)ABI36_0_0ReactSetFrame:(CGRect)frame
{
  // ignore setFrame call from ABI36_0_0React, the frame of this view
  // is controlled by the UIViewController it is contained in
}

- (void)updateBounds
{
  [_bridge.uiManager setSize:self.bounds.size forView:self];
}

- (void)setActive:(BOOL)active
{
  if (active != _active) {
    _active = active;
    [_ABI36_0_0ReactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(ABI36_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI36_0_0React props
}

- (void)setStackPresentation:(ABI36_0_0RNSScreenStackPresentation)stackPresentation
{
  _stackPresentation = stackPresentation;
  switch (stackPresentation) {
    case ABI36_0_0RNSScreenStackPresentationModal:
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
    case ABI36_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI36_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI36_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
  }
  // `modalPresentationStyle` must be set before accessing `presentationController`
  // otherwise a default controller will be created and cannot be changed after.
  // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
  _controller.presentationController.delegate = self;
}

- (void)setStackAnimation:(ABI36_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI36_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
    case ABI36_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
    case ABI36_0_0RNSScreenStackAnimationNone:
    case ABI36_0_0RNSScreenStackAnimationDefault:
      // Default
      break;
  }
}

- (UIView *)ABI36_0_0ReactSuperview
{
  return _ABI36_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI36_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI36_0_0RNSScreenStackHeaderConfig*) view).screenView = self;
  }
}

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyDismissed
{
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(nil);
      }
    });
  }
}

- (BOOL)isMountedUnderScreenOrABI36_0_0ReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI36_0_0RCTRootView class]] || [parent isKindOfClass:[ABI36_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For ABI36_0_0RN touches to work we need to instantiate and connect ABI36_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI36_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrABI36_0_0ReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[ABI36_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because ABI36_0_0RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI36_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI36_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
  [_touchHandler cancel];
  [_touchHandler reset];
}

@end

@implementation ABI36_0_0RNSScreen {
  __weak UIView *_view;
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
}

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    _view = view;
  }
  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (!CGRectEqualToRect(_lastViewFrame, self.view.frame)) {
    _lastViewFrame = self.view.frame;
    [((ABI36_0_0RNSScreenView *)self.view) updateBounds];
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
    [((ABI36_0_0RNSScreenView *)self.view) notifyDismissed];
  }
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

- (void)loadView
{
  if (_view != nil) {
    self.view = _view;
    _view = nil;
  }
}

@end

@implementation ABI36_0_0RNSScreenManager

ABI36_0_0RCT_EXPORT_MODULE()

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(active, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI36_0_0RNSScreenStackPresentation)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI36_0_0RNSScreenStackAnimation)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI36_0_0RCTDirectEventBlock);

- (UIView *)view
{
  return [[ABI36_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation ABI36_0_0RCTConvert (ABI36_0_0RNSScreen)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0RNSScreenStackPresentation, (@{
                                                  @"push": @(ABI36_0_0RNSScreenStackPresentationPush),
                                                  @"modal": @(ABI36_0_0RNSScreenStackPresentationModal),
                                                  @"containedModal": @(ABI36_0_0RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(ABI36_0_0RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(ABI36_0_0RNSScreenStackPresentationContainedTransparentModal)
                                                  }), ABI36_0_0RNSScreenStackPresentationPush, integerValue)

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0RNSScreenStackAnimation, (@{
                                                  @"default": @(ABI36_0_0RNSScreenStackAnimationDefault),
                                                  @"none": @(ABI36_0_0RNSScreenStackAnimationNone),
                                                  @"fade": @(ABI36_0_0RNSScreenStackAnimationFade),
                                                  @"flip": @(ABI36_0_0RNSScreenStackAnimationFlip),
                                                  }), ABI36_0_0RNSScreenStackAnimationDefault, integerValue)


@end

