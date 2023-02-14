#import <UIKit/UIKit.h>

#import "ABI48_0_0RNSScreen.h"
#import "ABI48_0_0RNSScreenContainer.h"
#import "ABI48_0_0RNSScreenWindowTraits.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTConversions.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricComponentsPlugins.h>
#import <ABI48_0_0React/ABI48_0_0RCTRootComponentView.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceTouchHandler.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI48_0_0RCTComponentViewHelpers.h>
#import <rnscreens/ABI48_0_0RNSScreenComponentDescriptor.h>
#import "ABI48_0_0RNSConvert.h"
#import "ABI48_0_0RNSScreenViewEvent.h"
#else
#import <ABI48_0_0React/ABI48_0_0RCTTouchHandler.h>
#endif

#import <ABI48_0_0React/ABI48_0_0RCTShadowView.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import "ABI48_0_0RNSScreenStack.h"
#import "ABI48_0_0RNSScreenStackHeaderConfig.h"

@interface ABI48_0_0RNSScreenView ()
#ifdef RN_FABRIC_ENABLED
    <ABI48_0_0RCTRNSScreenViewProtocol, UIAdaptivePresentationControllerDelegate>
#else
    <UIAdaptivePresentationControllerDelegate, ABI48_0_0RCTInvalidating>
#endif
@end

@implementation ABI48_0_0RNSScreenView {
  __weak ABI48_0_0RCTBridge *_bridge;
#ifdef RN_FABRIC_ENABLED
  ABI48_0_0RCTSurfaceTouchHandler *_touchHandler;
  ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenShadowNode::ConcreteState::Shared _state;
  // on fabric, they are not available by default so we need them exposed here too
  NSMutableArray<UIView *> *_ABI48_0_0ReactSubviews;
#else
  ABI48_0_0RCTTouchHandler *_touchHandler;
  CGRect _reactFrame;
#endif
}

#ifdef RN_FABRIC_ENABLED
- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenProps>();
    _props = defaultProps;
    _ABI48_0_0ReactSubviews = [NSMutableArray new];
    [self initCommonProps];
  }

  return self;
}
#endif // RN_FABRIC_ENABLED

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    [self initCommonProps];
  }

  return self;
}

- (void)initCommonProps
{
  _controller = [[ABI48_0_0RNSScreen alloc] initWithView:self];
  _stackPresentation = ABI48_0_0RNSScreenStackPresentationPush;
  _stackAnimation = ABI48_0_0RNSScreenStackAnimationDefault;
  _gestureEnabled = YES;
  _replaceAnimation = ABI48_0_0RNSScreenReplaceAnimationPop;
  _dismissed = NO;
  _hasStatusBarStyleSet = NO;
  _hasStatusBarAnimationSet = NO;
  _hasStatusBarHiddenSet = NO;
  _hasOrientationSet = NO;
  _hasHomeIndicatorHiddenSet = NO;
}

- (UIViewController *)ABI48_0_0ReactViewController
{
  return _controller;
}

#ifdef RN_FABRIC_ENABLED
- (NSArray<UIView *> *)ABI48_0_0ReactSubviews
{
  return _ABI48_0_0ReactSubviews;
}
#endif

- (void)updateBounds
{
#ifdef RN_FABRIC_ENABLED
  if (_state != nullptr) {
    auto newState = ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenState{ABI48_0_0RCTSizeFromCGSize(self.bounds.size)};
    _state->updateState(std::move(newState));
    UINavigationController *navctr = _controller.navigationController;
    [navctr.view setNeedsLayout];
  }
#else
  [_bridge.uiManager setSize:self.bounds.size forView:self];
#endif
}

- (void)setStackPresentation:(ABI48_0_0RNSScreenStackPresentation)stackPresentation
{
  switch (stackPresentation) {
    case ABI48_0_0RNSScreenStackPresentationModal:
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
    case ABI48_0_0RNSScreenStackPresentationFullScreenModal:
      _controller.modalPresentationStyle = UIModalPresentationFullScreen;
      break;
#if !TARGET_OS_TV
    case ABI48_0_0RNSScreenStackPresentationFormSheet:
      _controller.modalPresentationStyle = UIModalPresentationFormSheet;
      break;
#endif
    case ABI48_0_0RNSScreenStackPresentationTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
      break;
    case ABI48_0_0RNSScreenStackPresentationContainedModal:
      _controller.modalPresentationStyle = UIModalPresentationCurrentContext;
      break;
    case ABI48_0_0RNSScreenStackPresentationContainedTransparentModal:
      _controller.modalPresentationStyle = UIModalPresentationOverCurrentContext;
      break;
    case ABI48_0_0RNSScreenStackPresentationPush:
      // ignored, we only need to keep in mind not to set presentation delegate
      break;
  }

  // There is a bug in UIKit which causes retain loop when presentationController is accessed for a
  // controller that is not going to be presented modally. We therefore need to avoid setting the
  // delegate for screens presented using push. This also means that when controller is updated from
  // modal to push type, this may cause memory leak, we warn about that as well.
  if (stackPresentation != ABI48_0_0RNSScreenStackPresentationPush) {
    // `modalPresentationStyle` must be set before accessing `presentationController`
    // otherwise a default controller will be created and cannot be changed after.
    // Documented here:
    // https://developer.apple.com/documentation/uikit/uiviewcontroller/1621426-presentationcontroller?language=objc
    _controller.presentationController.delegate = self;
  } else if (_stackPresentation != ABI48_0_0RNSScreenStackPresentationPush) {
#ifdef RN_FABRIC_ENABLED
    // TODO: on Fabric, same controllers can be used as modals and then recycled and used a push which would result in
    // this error. It would be good to check if it doesn't leak in such case.
#else
    ABI48_0_0RCTLogError(
        @"Screen presentation updated from modal to push, this may likely result in a screen object leakage. If you need to change presentation style create a new screen object instead");
#endif
  }
  _stackPresentation = stackPresentation;
}

- (void)setStackAnimation:(ABI48_0_0RNSScreenStackAnimation)stackAnimation
{
  _stackAnimation = stackAnimation;

  switch (stackAnimation) {
    case ABI48_0_0RNSScreenStackAnimationFade:
      _controller.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
      break;
#if !TARGET_OS_TV
    case ABI48_0_0RNSScreenStackAnimationFlip:
      _controller.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
      break;
#endif
    case ABI48_0_0RNSScreenStackAnimationNone:
    case ABI48_0_0RNSScreenStackAnimationDefault:
    case ABI48_0_0RNSScreenStackAnimationSimplePush:
    case ABI48_0_0RNSScreenStackAnimationSlideFromBottom:
    case ABI48_0_0RNSScreenStackAnimationFadeFromBottom:
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

- (void)setReplaceAnimation:(ABI48_0_0RNSScreenReplaceAnimation)replaceAnimation
{
  _replaceAnimation = replaceAnimation;
}

// Nil will be provided when activityState is set as an animated value and we change
// it from JS to be a plain value (non animated).
// In case when nil is received, we want to ignore such value and not make
// any updates as the actual non-nil value will follow immediately.
- (void)setActivityStateOrNil:(NSNumber *)activityStateOrNil
{
  int activityState = [activityStateOrNil intValue];
  if (activityStateOrNil != nil && activityState != -1 && activityState != _activityState) {
    _activityState = activityState;
    [_ABI48_0_0ReactSuperview markChildUpdated];
  }
}

#if !TARGET_OS_TV
- (void)setStatusBarStyle:(ABI48_0_0RNSStatusBarStyle)statusBarStyle
{
  _hasStatusBarStyleSet = YES;
  _statusBarStyle = statusBarStyle;
  [ABI48_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI48_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setStatusBarAnimation:(UIStatusBarAnimation)statusBarAnimation
{
  _hasStatusBarAnimationSet = YES;
  _statusBarAnimation = statusBarAnimation;
  [ABI48_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
}

- (void)setStatusBarHidden:(BOOL)statusBarHidden
{
  _hasStatusBarHiddenSet = YES;
  _statusBarHidden = statusBarHidden;
  [ABI48_0_0RNSScreenWindowTraits assertViewControllerBasedStatusBarAppearenceSet];
  [ABI48_0_0RNSScreenWindowTraits updateStatusBarAppearance];
}

- (void)setScreenOrientation:(UIInterfaceOrientationMask)screenOrientation
{
  _hasOrientationSet = YES;
  _screenOrientation = screenOrientation;
  [ABI48_0_0RNSScreenWindowTraits enforceDesiredDeviceOrientation];
}

- (void)setHomeIndicatorHidden:(BOOL)homeIndicatorHidden
{
  _hasHomeIndicatorHiddenSet = YES;
  _homeIndicatorHidden = homeIndicatorHidden;
  [ABI48_0_0RNSScreenWindowTraits updateHomeIndicatorAutoHidden];
}
#endif

- (UIView *)ABI48_0_0ReactSuperview
{
  return _ABI48_0_0ReactSuperview;
}

- (void)addSubview:(UIView *)view
{
  if (![view isKindOfClass:[ABI48_0_0RNSScreenStackHeaderConfig class]]) {
    [super addSubview:view];
  } else {
    ((ABI48_0_0RNSScreenStackHeaderConfig *)view).screenView = self;
  }
}

- (void)notifyDismissedWithCount:(int)dismissCount
{
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onDismissed(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnDismissed{.dismissCount = dismissCount});
  }
#else
  // TODO: hopefully problems connected to dismissed prop are only the case on paper
  _dismissed = YES;
  if (self.onDismissed) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onDismissed) {
        self.onDismissed(@{@"dismissCount" : @(dismissCount)});
      }
    });
  }
#endif
}

- (void)notifyDismissCancelledWithDismissCount:(int)dismissCount
{
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onNativeDismissCancelled(
            ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnNativeDismissCancelled{.dismissCount = dismissCount});
  }
#else
  if (self.onNativeDismissCancelled) {
    self.onNativeDismissCancelled(@{@"dismissCount" : @(dismissCount)});
  }
#endif
}

- (void)notifyWillAppear
{
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onWillAppear(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnWillAppear{});
  }
  [self updateLayoutMetrics:_newLayoutMetrics oldLayoutMetrics:_oldLayoutMetrics];
#else
  if (self.onWillAppear) {
    self.onWillAppear(nil);
  }
  // we do it here too because at this moment the `parentViewController` is already not nil,
  // so if the parent is not UINavCtr, the frame will be updated to the correct one.
  [self ABI48_0_0ReactSetFrame:_reactFrame];
#endif
}

- (void)notifyWillDisappear
{
  if (_hideKeyboardOnSwipe) {
    [self endEditing:YES];
  }
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onWillDisappear(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnWillDisappear{});
  }
#else
  if (self.onWillDisappear) {
    self.onWillDisappear(nil);
  }
#endif
}

- (void)notifyAppear
{
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onAppear(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnAppear{});
  }
#else
  if (self.onAppear) {
    dispatch_async(dispatch_get_main_queue(), ^{
      if (self.onAppear) {
        self.onAppear(nil);
      }
    });
  }
#endif
}

- (void)notifyDisappear
{
#ifdef RN_FABRIC_ENABLED
  // If screen is already unmounted then there will be no event emitter
  // it will be cleaned in prepareForRecycle
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onDisappear(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnDisappear{});
  }
#else
  if (self.onDisappear) {
    self.onDisappear(nil);
  }
#endif
}

- (BOOL)isMountedUnderScreenOrReactRoot
{
#ifdef RN_FABRIC_ENABLED
#define ABI48_0_0RNS_EXPECTED_VIEW ABI48_0_0RCTRootComponentView
#else
#define ABI48_0_0RNS_EXPECTED_VIEW ABI48_0_0RCTRootView
#endif
  for (UIView *parent = self.superview; parent != nil; parent = parent.superview) {
    if ([parent isKindOfClass:[ABI48_0_0RNS_EXPECTED_VIEW class]] || [parent isKindOfClass:[ABI48_0_0RNSScreenView class]]) {
      return YES;
    }
  }
  return NO;
#undef ABI48_0_0RNS_EXPECTED_VIEW
}

- (void)didMoveToWindow
{
  // For RN touches to work we need to instantiate and connect ABI48_0_0RCTTouchHandler. This only applies
  // for screens that aren't mounted under ABI48_0_0RCTRootView e.g., modals that are mounted directly to
  // root application window.
  if (self.window != nil && ![self isMountedUnderScreenOrReactRoot]) {
    if (_touchHandler == nil) {
#ifdef RN_FABRIC_ENABLED
      _touchHandler = [ABI48_0_0RCTSurfaceTouchHandler new];
#else
      _touchHandler = [[ABI48_0_0RCTTouchHandler alloc] initWithBridge:_bridge];
#endif
    }
    [_touchHandler attachToView:self];
  } else {
    [_touchHandler detachFromView:self];
  }
}

#ifdef RN_FABRIC_ENABLED
- (ABI48_0_0RCTSurfaceTouchHandler *)touchHandler
#else
- (ABI48_0_0RCTTouchHandler *)touchHandler
#endif
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

- (void)notifyFinishTransitioning
{
  [_controller notifyFinishTransitioning];
}

- (void)notifyTransitionProgress:(double)progress closing:(BOOL)closing goingForward:(BOOL)goingForward
{
#ifdef RN_FABRIC_ENABLED
  if (_eventEmitter != nullptr) {
    std::dynamic_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter>(_eventEmitter)
        ->onTransitionProgress(ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenEventEmitter::OnTransitionProgress{
            .progress = progress, .closing = closing ? 1 : 0, .goingForward = goingForward ? 1 : 0});
  }
  ABI48_0_0RNSScreenViewEvent *event = [[ABI48_0_0RNSScreenViewEvent alloc] initWithEventName:@"onTransitionProgress"
                                                                   ABI48_0_0ReactTag:[NSNumber numberWithInt:self.tag]
                                                                   progress:progress
                                                                    closing:closing
                                                               goingForward:goingForward];
  [[ABI48_0_0RCTBridge currentBridge].eventDispatcher sendEvent:event];
#else
  if (self.onTransitionProgress) {
    self.onTransitionProgress(@{
      @"progress" : @(progress),
      @"closing" : @(closing ? 1 : 0),
      @"goingForward" : @(goingForward ? 1 : 0),
    });
  }
#endif
}

- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController
{
  // We need to call both "cancel" and "reset" here because RN's gesture recognizer
  // does not handle the scenario when it gets cancelled by other top
  // level gesture recognizer. In this case by the modal dismiss gesture.
  // Because of that, at the moment when this method gets called the ABI48_0_0React's
  // gesture recognizer is already in FAILED state but cancel events never gets
  // send to JS. Calling "reset" forces ABI48_0_0RCTTouchHanler to dispatch cancel event.
  // To test this behavior one need to open a dismissable modal and start
  // pulling down starting at some touchable item. Without "reset" the touchable
  // will never go back from highlighted state even when the modal start sliding
  // down.
#ifdef RN_FABRIC_ENABLED
  [_touchHandler setEnabled:NO];
  [_touchHandler setEnabled:YES];
#else
  [_touchHandler cancel];
#endif
  [_touchHandler reset];
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
  if ([_ABI48_0_0ReactSuperview respondsToSelector:@selector(presentationControllerDidDismiss:)]) {
    [_ABI48_0_0ReactSuperview performSelector:@selector(presentationControllerDidDismiss:) withObject:presentationController];
  }
}

- (BOOL)isModal
{
  return self.stackPresentation != ABI48_0_0RNSScreenStackPresentationPush;
}

#pragma mark - Fabric specific
#ifdef RN_FABRIC_ENABLED

+ (ABI48_0_0facebook::ABI48_0_0React::ComponentDescriptorProvider)componentDescriptorProvider
{
  return ABI48_0_0facebook::ABI48_0_0React::concreteComponentDescriptorProvider<ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenComponentDescriptor>();
}

- (void)mountChildComponentView:(UIView<ABI48_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  if ([childComponentView isKindOfClass:[ABI48_0_0RNSScreenStackHeaderConfig class]]) {
    _config = childComponentView;
    ((ABI48_0_0RNSScreenStackHeaderConfig *)childComponentView).screenView = self;
  }
  [_ABI48_0_0ReactSubviews insertObject:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI48_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if ([childComponentView isKindOfClass:[ABI48_0_0RNSScreenStackHeaderConfig class]]) {
    _config = nil;
  }
  [_ABI48_0_0ReactSubviews removeObject:childComponentView];
  [super unmountChildComponentView:childComponentView index:index];
}

#pragma mark - ABI48_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // TODO: Make sure that there is no edge case when this should be uncommented
  // _controller=nil;
  _dismissed = NO;
  _state.reset();
  _touchHandler = nil;

  // We set this prop to default value here to workaround view-recycling.
  // Let's assume the view has had _stackPresentation == <some modal stack presentation> set
  // before below line was executed. Then, when instantiated again (with the same modal presentation)
  // updateProps:oldProps: method would be called and setter for stack presentation would not be called.
  // This is crucial as in that setter we register `self.controller` as a delegate
  // (UIAdaptivePresentationControllerDelegate) to presentation controller and this leads to buggy modal behaviour as we
  // rely on UIAdaptivePresentationControllerDelegate callbacks. Restoring the default value and then comparing against
  // it in updateProps:oldProps: allows for setter to be called, however if there was some additional logic to execute
  // when stackPresentation is set to "push" the setter would not be triggered.
  _stackPresentation = ABI48_0_0RNSScreenStackPresentationPush;
}

- (void)updateProps:(ABI48_0_0facebook::ABI48_0_0React::Props::Shared const &)props
           oldProps:(ABI48_0_0facebook::ABI48_0_0React::Props::Shared const &)oldProps
{
  const auto &oldScreenProps = *std::static_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenProps>(_props);
  const auto &newScreenProps = *std::static_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenProps>(props);

  [self setFullScreenSwipeEnabled:newScreenProps.fullScreenSwipeEnabled];

  [self setGestureEnabled:newScreenProps.gestureEnabled];

  [self setTransitionDuration:[NSNumber numberWithInt:newScreenProps.transitionDuration]];

  [self setHideKeyboardOnSwipe:newScreenProps.hideKeyboardOnSwipe];

  [self setCustomAnimationOnSwipe:newScreenProps.customAnimationOnSwipe];

  [self
      setGestureResponseDistance:[ABI48_0_0RNSConvert
                                     gestureResponseDistanceDictFromCppStruct:newScreenProps.gestureResponseDistance]];

  [self setPreventNativeDismiss:newScreenProps.preventNativeDismiss];

  [self setActivityStateOrNil:[NSNumber numberWithFloat:newScreenProps.activityState]];

  [self setSwipeDirection:[ABI48_0_0RNSConvert ABI48_0_0RNSScreenSwipeDirectionFromCppEquivalent:newScreenProps.swipeDirection]];

#if !TARGET_OS_TV
  if (newScreenProps.statusBarHidden != oldScreenProps.statusBarHidden) {
    [self setStatusBarHidden:newScreenProps.statusBarHidden];
  }

  if (newScreenProps.statusBarStyle != oldScreenProps.statusBarStyle) {
    [self setStatusBarStyle:[ABI48_0_0RCTConvert
                                ABI48_0_0RNSStatusBarStyle:ABI48_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.statusBarStyle)]];
  }

  if (newScreenProps.statusBarAnimation != oldScreenProps.statusBarAnimation) {
    [self setStatusBarAnimation:[ABI48_0_0RCTConvert UIStatusBarAnimation:ABI48_0_0RCTNSStringFromStringNilIfEmpty(
                                                                     newScreenProps.statusBarAnimation)]];
  }

  if (newScreenProps.screenOrientation != oldScreenProps.screenOrientation) {
    [self setScreenOrientation:[ABI48_0_0RCTConvert UIInterfaceOrientationMask:ABI48_0_0RCTNSStringFromStringNilIfEmpty(
                                                                          newScreenProps.screenOrientation)]];
  }

  if (newScreenProps.homeIndicatorHidden != oldScreenProps.homeIndicatorHidden) {
    [self setHomeIndicatorHidden:newScreenProps.homeIndicatorHidden];
  }
#endif // !TARGET_OS_TV

  // Notice that we compare against _stackPresentation, not oldScreenProps.stackPresentation.
  // See comment in prepareForRecycle method for explanation.
  ABI48_0_0RNSScreenStackPresentation newStackPresentation =
      [ABI48_0_0RNSConvert ABI48_0_0RNSScreenStackPresentationFromCppEquivalent:newScreenProps.stackPresentation];
  if (newStackPresentation != _stackPresentation) {
    [self setStackPresentation:newStackPresentation];
  }

  if (newScreenProps.stackAnimation != oldScreenProps.stackAnimation) {
    [self setStackAnimation:[ABI48_0_0RNSConvert ABI48_0_0RNSScreenStackAnimationFromCppEquivalent:newScreenProps.stackAnimation]];
  }

  if (newScreenProps.replaceAnimation != oldScreenProps.replaceAnimation) {
    [self setReplaceAnimation:[ABI48_0_0RNSConvert ABI48_0_0RNSScreenReplaceAnimationFromCppEquivalent:newScreenProps.replaceAnimation]];
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(ABI48_0_0facebook::ABI48_0_0React::State::Shared const &)state
           oldState:(ABI48_0_0facebook::ABI48_0_0React::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0RNSScreenShadowNode::ConcreteState>(state);
}

- (void)updateLayoutMetrics:(const ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics &)oldLayoutMetrics
{
  _newLayoutMetrics = layoutMetrics;
  _oldLayoutMetrics = oldLayoutMetrics;
  UIViewController *parentVC = self.ABI48_0_0ReactViewController.parentViewController;
  if (parentVC != nil && ![parentVC isKindOfClass:[ABI48_0_0RNScreensNavigationController class]]) {
    [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  }
  // when screen is mounted under ABI48_0_0RNScreensNavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimensions and we wait for the screen VC to update and then we
  // pass the dimensions to ui view manager to take into account when laying out
  // subviews
  // Explanation taken from `ABI48_0_0ReactSetFrame`, which is old arch equivalent of this code.
}

#pragma mark - Paper specific
#else

- (void)setPointerEvents:(ABI48_0_0RCTPointerEvents)pointerEvents
{
  // pointer events settings are managed by the parent screen container, we ignore
  // any attempt of setting that via ABI48_0_0React props
}

- (void)ABI48_0_0ReactSetFrame:(CGRect)frame
{
  _reactFrame = frame;
  UIViewController *parentVC = self.ABI48_0_0ReactViewController.parentViewController;
  if (parentVC != nil && ![parentVC isKindOfClass:[ABI48_0_0RNScreensNavigationController class]]) {
    [super ABI48_0_0ReactSetFrame:frame];
  }
  // when screen is mounted under ABI48_0_0RNScreensNavigationController it's size is controller
  // by the navigation controller itself. That is, it is set to fill space of
  // the controller. In that case we ignore react layout system from managing
  // the screen dimensions and we wait for the screen VC to update and then we
  // pass the dimensions to ui view manager to take into account when laying out
  // subviews
}

- (void)invalidate
{
  _controller = nil;
}
#endif

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI48_0_0RCTComponentViewProtocol> ABI48_0_0RNSScreenCls(void)
{
  return ABI48_0_0RNSScreenView.class;
}
#endif

#pragma mark - ABI48_0_0RNSScreen

@implementation ABI48_0_0RNSScreen {
  __weak id _previousFirstResponder;
  CGRect _lastViewFrame;
  ABI48_0_0RNSScreenView *_initialView;
  UIView *_fakeView;
  CADisplayLink *_animationTimer;
  CGFloat _currentAlpha;
  BOOL _closing;
  BOOL _goingForward;
  int _dismissCount;
  BOOL _isSwiping;
  BOOL _shouldNotify;
}

#pragma mark - Common

- (instancetype)initWithView:(UIView *)view
{
  if (self = [super init]) {
    self.view = view;
    _fakeView = [UIView new];
    _shouldNotify = YES;
#ifdef RN_FABRIC_ENABLED
    _initialView = (ABI48_0_0RNSScreenView *)view;
#endif
  }
  return self;
}

// TODO: Find out why this is executed when screen is going out
- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  if (!_isSwiping) {
    [self.screenView notifyWillAppear];
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

  [ABI48_0_0RNSScreenWindowTraits updateWindowTraits];
  if (_shouldNotify) {
    _closing = NO;
    [self notifyTransitionProgress:0.0 closing:_closing goingForward:_goingForward];
    [self setupProgressNotification];
  }
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  // self.navigationController might be null when we are dismissing a modal
  if (!self.transitionCoordinator.isInteractive && self.navigationController != nil) {
    // user might have long pressed ios 14 back button item,
    // so he can go back more than one screen and we need to dismiss more screens in JS stack then.
    // We check it by calculating the difference between the index of currently displayed screen
    // and the index of the target screen, which is the view of topViewController at this point.
    // If the value is lower than 1, it means we are dismissing a modal, or navigating forward, or going back with JS.
    int selfIndex = [self getIndexOfView:self.screenView];
    int targetIndex = [self getIndexOfView:self.navigationController.topViewController.view];
    _dismissCount = selfIndex - targetIndex > 0 ? selfIndex - targetIndex : 1;
  } else {
    _dismissCount = 1;
  }

  // same flow as in viewWillAppear
  if (!_isSwiping) {
    [self.screenView notifyWillDisappear];
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
    [self.screenView notifyAppear];
    [self notifyTransitionProgress:1.0 closing:NO goingForward:_goingForward];
  }

  _isSwiping = NO;
  _shouldNotify = YES;
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
#ifdef RN_FABRIC_ENABLED
  [self resetViewToScreen];
#endif
  if (self.parentViewController == nil && self.presentingViewController == nil) {
    if (self.screenView.preventNativeDismiss) {
      // if we want to prevent the native dismiss, we do not send dismissal event,
      // but instead call `updateContainer`, which restores the JS navigation stack
      [self.screenView.ABI48_0_0ReactSuperview updateContainer];
      [self.screenView notifyDismissCancelledWithDismissCount:_dismissCount];
    } else {
      // screen dismissed, send event
      [self.screenView notifyDismissedWithCount:_dismissCount];
    }
  }
  // same flow as in viewDidAppear
  if (!_isSwiping || _shouldNotify) {
    [self.screenView notifyDisappear];
    [self notifyTransitionProgress:1.0 closing:YES goingForward:_goingForward];
  }

  _isSwiping = NO;
  _shouldNotify = YES;
#ifdef RN_FABRIC_ENABLED
#else
  [self traverseForScrollView:self.screenView];
#endif
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  // The below code makes the screen view adapt dimensions provided by the system. We take these
  // into account only when the view is mounted under ABI48_0_0RNScreensNavigationController in which case system
  // provides additional padding to account for possible header, and in the case when screen is
  // shown as a native modal, as the final dimensions of the modal on iOS 12+ are shorter than the
  // screen size
  BOOL isDisplayedWithinUINavController =
      [self.parentViewController isKindOfClass:[ABI48_0_0RNScreensNavigationController class]];
  BOOL isPresentedAsNativeModal = self.parentViewController == nil && self.presentingViewController != nil;

  if (isDisplayedWithinUINavController || isPresentedAsNativeModal) {
#ifdef RN_FABRIC_ENABLED
    [self.screenView updateBounds];
#else
    if (!CGRectEqualToRect(_lastViewFrame, self.screenView.frame)) {
      _lastViewFrame = self.screenView.frame;
      [((ABI48_0_0RNSScreenView *)self.viewIfLoaded) updateBounds];
    }
#endif
  }
}

- (void)notifyFinishTransitioning
{
  [_previousFirstResponder becomeFirstResponder];
  _previousFirstResponder = nil;
  // the correct Screen for appearance is set after the transition, same for orientation.
  [ABI48_0_0RNSScreenWindowTraits updateWindowTraits];
}

- (void)willMoveToParentViewController:(UIViewController *)parent
{
  [super willMoveToParentViewController:parent];
  if (parent == nil) {
    id responder = [self findFirstResponder:self.screenView];
    if (responder != nil) {
      _previousFirstResponder = responder;
    }
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
  if ([self.view isKindOfClass:[ABI48_0_0RNSScreenView class]]) {
    // if the view is already snapshot, there is not sense in sending progress since on JS side
    // the component is already not present
    [(ABI48_0_0RNSScreenView *)self.view notifyTransitionProgress:progress closing:closing goingForward:goingForward];
  }
}

#if !TARGET_OS_TV
// if the returned vc is a child, it means that it can provide config;
// if the returned vc is self, it means that there is no child for config and self has config to provide,
// so we return self which results in asking self for preferredStatusBarStyle/Animation etc.;
// if the returned vc is nil, it means none of children could provide config and self does not have config either,
// so if it was asked by parent, it will fallback to parent's option, or use default option if it is the top Screen
- (UIViewController *)findChildVCForConfigAndTrait:(ABI48_0_0RNSWindowTrait)trait includingModals:(BOOL)includingModals
{
  UIViewController *lastViewController = [[self childViewControllers] lastObject];
  if ([self.presentedViewController isKindOfClass:[ABI48_0_0RNSScreen class]]) {
    lastViewController = self.presentedViewController;
    // we don't want to allow controlling of status bar appearance when we present non-fullScreen modal
    // and it is not possible if `modalPresentationCapturesStatusBarAppearance` is not set to YES, so even
    // if we went into a modal here and ask it, it wouldn't take any effect. For fullScreen modals, the system
    // asks them by itself, so we can stop traversing here.
    // for screen orientation, we need to start the search again from that modal
    return !includingModals
        ? nil
        : [(ABI48_0_0RNSScreen *)lastViewController findChildVCForConfigAndTrait:trait includingModals:includingModals]
            ?: lastViewController;
  }

  UIViewController *selfOrNil = [self hasTraitSet:trait] ? self : nil;
  if (lastViewController == nil) {
    return selfOrNil;
  } else {
    if ([lastViewController conformsToProtocol:@protocol(ABI48_0_0RNScreensViewControllerDelegate)]) {
      // If there is a child (should be VC of ScreenContainer or ScreenStack), that has a child that could provide the
      // trait, we recursively go into its findChildVCForConfig, and if one of the children has the trait set, we return
      // it, otherwise we return self if this VC has config, and nil if it doesn't we use
      // `childViewControllerForStatusBarStyle` for all options since the behavior is the same for all of them
      UIViewController *childScreen = [lastViewController childViewControllerForStatusBarStyle];
      if ([childScreen isKindOfClass:[ABI48_0_0RNSScreen class]]) {
        return [(ABI48_0_0RNSScreen *)childScreen findChildVCForConfigAndTrait:trait includingModals:includingModals]
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

- (BOOL)hasTraitSet:(ABI48_0_0RNSWindowTrait)trait
{
  switch (trait) {
    case ABI48_0_0RNSWindowTraitStyle: {
      return self.screenView.hasStatusBarStyleSet;
    }
    case ABI48_0_0RNSWindowTraitAnimation: {
      return self.screenView.hasStatusBarAnimationSet;
    }
    case ABI48_0_0RNSWindowTraitHidden: {
      return self.screenView.hasStatusBarHiddenSet;
    }
    case ABI48_0_0RNSWindowTraitOrientation: {
      return self.screenView.hasOrientationSet;
    }
    case ABI48_0_0RNSWindowTraitHomeIndicatorHidden: {
      return self.screenView.hasHomeIndicatorHiddenSet;
    }
    default: {
      ABI48_0_0RCTLogError(@"Unknown trait passed: %d", (int)trait);
    }
  }
  return NO;
}

- (UIViewController *)childViewControllerForStatusBarHidden
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI48_0_0RNSWindowTraitHidden includingModals:NO];
  return vc == self ? nil : vc;
}

- (BOOL)prefersStatusBarHidden
{
  return self.screenView.statusBarHidden;
}

- (UIViewController *)childViewControllerForStatusBarStyle
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI48_0_0RNSWindowTraitStyle includingModals:NO];
  return vc == self ? nil : vc;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [ABI48_0_0RNSScreenWindowTraits statusBarStyleForRNSStatusBarStyle:self.screenView.statusBarStyle];
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI48_0_0RNSWindowTraitAnimation includingModals:NO];

  if ([vc isKindOfClass:[ABI48_0_0RNSScreen class]]) {
    return ((ABI48_0_0RNSScreen *)vc).screenView.statusBarAnimation;
  }
  return UIStatusBarAnimationFade;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI48_0_0RNSWindowTraitOrientation includingModals:YES];

  if ([vc isKindOfClass:[ABI48_0_0RNSScreen class]]) {
    return ((ABI48_0_0RNSScreen *)vc).screenView.screenOrientation;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

- (UIViewController *)childViewControllerForHomeIndicatorAutoHidden
{
  UIViewController *vc = [self findChildVCForConfigAndTrait:ABI48_0_0RNSWindowTraitHomeIndicatorHidden includingModals:YES];
  return vc == self ? nil : vc;
}

- (BOOL)prefersHomeIndicatorAutoHidden
{
  return self.screenView.homeIndicatorHidden;
}
- (int)getParentChildrenCount
{
  return (int)[[self.screenView.ABI48_0_0ReactSuperview ABI48_0_0ReactSubviews] count];
}
#endif

- (int)getIndexOfView:(UIView *)view
{
  return (int)[[self.screenView.ABI48_0_0ReactSuperview ABI48_0_0ReactSubviews] indexOfObject:view];
}

// since on Fabric the view of controller can be a snapshot of type `UIView`,
// when we want to check props of ScreenView, we need to get them from _initialView
- (ABI48_0_0RNSScreenView *)screenView
{
#ifdef RN_FABRIC_ENABLED
  return _initialView;
#else
  return (ABI48_0_0RNSScreenView *)self.view;
#endif
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

    // we need to check whether ABI48_0_0ReactSubviews array is empty, because on Fabric child nodes are unmounted first ->
    // ABI48_0_0ReactSubviews array may be empty
    if (currentIndex > 0 && [self.screenView.ABI48_0_0ReactSubviews count] > 0 &&
        [self.screenView.ABI48_0_0ReactSubviews[0] isKindOfClass:[ABI48_0_0RNSScreenStackHeaderConfig class]]) {
      UINavigationItem *prevNavigationItem =
          [self.navigationController.viewControllers objectAtIndex:currentIndex - 1].navigationItem;
      ABI48_0_0RNSScreenStackHeaderConfig *config = ((ABI48_0_0RNSScreenStackHeaderConfig *)self.screenView.ABI48_0_0ReactSubviews[0]);

      BOOL wasSearchBarActive = prevNavigationItem.searchController.active;

#ifdef RN_FABRIC_ENABLED
      BOOL shouldHideHeader = !config.show;
#else
      BOOL shouldHideHeader = config.hide;
#endif

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

#ifdef RN_FABRIC_ENABLED
#pragma mark - Fabric specific

- (void)setViewToSnapshot:(UIView *)snapshot
{
  // modals of native stack seem not to support
  // changing their view by just setting the view
  if (_initialView.stackPresentation != ABI48_0_0RNSScreenStackPresentationPush) {
    UIView *superView = self.view.superview;
    [self.view removeFromSuperview];
    self.view = snapshot;
    [superView addSubview:self.view];
  } else {
    [self.view removeFromSuperview];
    self.view = snapshot;
  }
}

- (void)resetViewToScreen
{
  if (self.view != _initialView) {
    [self.view removeFromSuperview];
    self.view = _initialView;
  }
}

#else
#pragma mark - Paper specific

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
#endif

@end

@implementation ABI48_0_0RNSScreenManager

ABI48_0_0RCT_EXPORT_MODULE()

// we want to handle the case when activityState is nil
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(activityState, activityStateOrNil, NSNumber)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(customAnimationOnSwipe, BOOL);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fullScreenSwipeEnabled, BOOL);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gestureEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gestureResponseDistance, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardOnSwipe, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(preventNativeDismiss, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(replaceAnimation, ABI48_0_0RNSScreenReplaceAnimation)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(stackPresentation, ABI48_0_0RNSScreenStackPresentation)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(stackAnimation, ABI48_0_0RNSScreenStackAnimation)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(swipeDirection, ABI48_0_0RNSScreenSwipeDirection)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(transitionDuration, NSNumber)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onAppear, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDisappear, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDismissed, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onNativeDismissCancelled, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onTransitionProgress, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onWillAppear, ABI48_0_0RCTDirectEventBlock);
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onWillDisappear, ABI48_0_0RCTDirectEventBlock);

#if !TARGET_OS_TV
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(screenOrientation, UIInterfaceOrientationMask)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarAnimation, UIStatusBarAnimation)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarHidden, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarStyle, ABI48_0_0RNSStatusBarStyle)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(homeIndicatorHidden, BOOL)
#endif

#if !TARGET_OS_TV
// See:
// 1. https://github.com/software-mansion/react-native-screens/pull/1543
// 2. https://github.com/software-mansion/react-native-screens/pull/1596
// This class is instatiated from ABI48_0_0React Native's internals during application startup
- (instancetype)init
{
  if (self = [super init]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    });
  }
  return self;
}

- (void)dealloc
{
  dispatch_sync(dispatch_get_main_queue(), ^{
    [[UIDevice currentDevice] endGeneratingDeviceOrientationNotifications];
  });
}
#endif // !TARGET_OS_TV

- (UIView *)view
{
  return [[ABI48_0_0RNSScreenView alloc] initWithBridge:self.bridge];
}

+ (BOOL)requiresMainQueueSetup
{
  // Returning NO here despite the fact some initialization in -init method dispatches tasks
  // on main queue, because the comments in RN source code states that modules which return YES
  // here will be constructed ahead-of-time -- and this is not required in our case.
  return NO;
}

@end

@implementation ABI48_0_0RCTConvert (ABI48_0_0RNSScreen)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RNSScreenStackPresentation,
    (@{
      @"push" : @(ABI48_0_0RNSScreenStackPresentationPush),
      @"modal" : @(ABI48_0_0RNSScreenStackPresentationModal),
      @"fullScreenModal" : @(ABI48_0_0RNSScreenStackPresentationFullScreenModal),
      @"formSheet" : @(ABI48_0_0RNSScreenStackPresentationFormSheet),
      @"containedModal" : @(ABI48_0_0RNSScreenStackPresentationContainedModal),
      @"transparentModal" : @(ABI48_0_0RNSScreenStackPresentationTransparentModal),
      @"containedTransparentModal" : @(ABI48_0_0RNSScreenStackPresentationContainedTransparentModal)
    }),
    ABI48_0_0RNSScreenStackPresentationPush,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RNSScreenStackAnimation,
    (@{
      @"default" : @(ABI48_0_0RNSScreenStackAnimationDefault),
      @"none" : @(ABI48_0_0RNSScreenStackAnimationNone),
      @"fade" : @(ABI48_0_0RNSScreenStackAnimationFade),
      @"fade_from_bottom" : @(ABI48_0_0RNSScreenStackAnimationFadeFromBottom),
      @"flip" : @(ABI48_0_0RNSScreenStackAnimationFlip),
      @"simple_push" : @(ABI48_0_0RNSScreenStackAnimationSimplePush),
      @"slide_from_bottom" : @(ABI48_0_0RNSScreenStackAnimationSlideFromBottom),
      @"slide_from_right" : @(ABI48_0_0RNSScreenStackAnimationDefault),
      @"slide_from_left" : @(ABI48_0_0RNSScreenStackAnimationDefault),
    }),
    ABI48_0_0RNSScreenStackAnimationDefault,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RNSScreenReplaceAnimation,
    (@{
      @"push" : @(ABI48_0_0RNSScreenReplaceAnimationPush),
      @"pop" : @(ABI48_0_0RNSScreenReplaceAnimationPop),
    }),
    ABI48_0_0RNSScreenReplaceAnimationPop,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RNSScreenSwipeDirection,
    (@{
      @"vertical" : @(ABI48_0_0RNSScreenSwipeDirectionVertical),
      @"horizontal" : @(ABI48_0_0RNSScreenSwipeDirectionHorizontal),
    }),
    ABI48_0_0RNSScreenSwipeDirectionHorizontal,
    integerValue)

#if !TARGET_OS_TV
ABI48_0_0RCT_ENUM_CONVERTER(
    UIStatusBarAnimation,
    (@{
      @"none" : @(UIStatusBarAnimationNone),
      @"fade" : @(UIStatusBarAnimationFade),
      @"slide" : @(UIStatusBarAnimationSlide)
    }),
    UIStatusBarAnimationNone,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RNSStatusBarStyle,
    (@{
      @"auto" : @(ABI48_0_0RNSStatusBarStyleAuto),
      @"inverted" : @(ABI48_0_0RNSStatusBarStyleInverted),
      @"light" : @(ABI48_0_0RNSStatusBarStyleLight),
      @"dark" : @(ABI48_0_0RNSStatusBarStyleDark),
    }),
    ABI48_0_0RNSStatusBarStyleAuto,
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
