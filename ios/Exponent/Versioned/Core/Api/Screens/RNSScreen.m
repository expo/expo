#import <UIKit/UIKit.h>

#import "RNSScreen.h"
#import "RNSScreenContainer.h"
#import "RNSScreenStackHeaderConfig.h"

#import <React/RCTUIManager.h>
#import <React/RCTShadowView.h>
#import <React/RCTTouchHandler.h>

@interface RNSScreenView () <UIAdaptivePresentationControllerDelegate, RCTInvalidating>
@end

@implementation RNSScreenView {
  __weak RCTBridge *_bridge;
  RNSScreen *_controller;
  RCTTouchHandler *_touchHandler;
}

@synthesize controller = _controller;

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _controller = [[RNSScreen alloc] initWithView:self];
    _stackPresentation = RNSScreenStackPresentationPush;
    _stackAnimation = RNSScreenStackAnimationDefault;
    _gestureEnabled = YES;
    _dismissed = NO;
  }

  return self;
}

- (void)reactSetFrame:(CGRect)frame
{
  if (![self.reactViewController.parentViewController
        isKindOfClass:[UINavigationController class]]) {
    [super reactSetFrame:frame];
  }
  // when screen is mounted under UINavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimentions and we wait for the screen VC to update and then we
  // pass the dimentions to ui view manager to take into account when laying out
  // subviews
}

- (UIViewController *)reactViewController
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
    [_reactSuperview markChildUpdated];
  }
}

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via React props
}

- (void)setStackPresentation:(RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case RNSScreenStackPresentationModal:
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
    case RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
    case RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
    case RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }
  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here: https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != RNSScreenStackPresentationPush) {
    RCTLogError(@"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
    case RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
    case RNSScreenStackAnimationNone:
    case RNSScreenStackAnimationDefault:
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

- (UIView *)reactSuperview
{
  return _reactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((RNSScreenStackHeaderConfig*) view).screenView = self;
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

- (BOOL)isMountedUnderScreenOrReactRoot
{
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[RCTRootView class]] || [parent isKindOfClass:[RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect RCTTouchHandler. This only applies
  // for screens that aren't mounted under RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
      _touchHandler = [[RCTTouchHandler alloc] initWithBridge:_bridge];
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
  // Because of that, at the moment when this method gets called the React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces RCTTouchHanler to dispatch cancel event.
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
  if ([_reactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_reactSuperview performSelector:@selector(presentationControllerDidDismiss:)
                          withObject:presentationController];
  }
}

- (void)invalidate
{
  _controller = nil;
}

@end

@implementation RNSScreen {
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
    [((RNSScreenView *)self.viewIfLoaded) updateBounds];
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
    [((RNSScreenView *)self.view) notifyDismissed];
  }
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [((RNSScreenView *)self.view) notifyAppear];
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
}

@end

@implementation RNSScreenManager

RCT_EXPORT_MODULE()

RCT_EXPORT_VIEW_PROPERTY(active, BOOL)
RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(stackPresentation, RNSScreenStackPresentation)
RCT_EXPORT_VIEW_PROPERTY(stackAnimation, RNSScreenStackAnimation)
RCT_EXPORT_VIEW_PROPERTY(onAppear, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onDismissed, RCTDirectEventBlock);

- (UIView *)view
{
  return [[RNSScreenView alloc] initWithBridge:self.bridge];
}

@end

@implementation RCTConvert (RNSScreen)

RCT_ENUM_CONVERTER(RNSScreenStackPresentation, (@{
                                                  @"push": @(RNSScreenStackPresentationPush),
                                                  @"modal": @(RNSScreenStackPresentationModal),
                                                  @"fullScreenModal": @(RNSScreenStackPresentationFullScreenModal),
                                                  @"formSheet": @(RNSScreenStackPresentationFormSheet),
                                                  @"containedModal": @(RNSScreenStackPresentationContainedModal),
                                                  @"transparentModal": @(RNSScreenStackPresentationTransparentModal),
                                                  @"containedTransparentModal": @(RNSScreenStackPresentationContainedTransparentModal)
                                                  }), RNSScreenStackPresentationPush, integerValue)

RCT_ENUM_CONVERTER(RNSScreenStackAnimation, (@{
                                                  @"default": @(RNSScreenStackAnimationDefault),
                                                  @"none": @(RNSScreenStackAnimationNone),
                                                  @"fade": @(RNSScreenStackAnimationFade),
                                                  @"flip": @(RNSScreenStackAnimationFlip),
                                                  }), RNSScreenStackAnimationDefault, integerValue)


@end

