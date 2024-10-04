/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTModalHostViewComponentView.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTModalManager.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>
#import <ABI47_0_0React/ABI47_0_0renderer/components/modal/ModalHostViewComponentDescriptor.h>
#import <ABI47_0_0React/ABI47_0_0renderer/components/modal/ModalHostViewState.h>
#import <ABI47_0_0React/ABI47_0_0renderer/components/rncore/EventEmitters.h>
#import <ABI47_0_0React/ABI47_0_0renderer/components/rncore/Props.h>

#import "ABI47_0_0RCTConversions.h"

#import "ABI47_0_0RCTFabricModalHostViewController.h"

using namespace ABI47_0_0facebook::ABI47_0_0React;

static UIInterfaceOrientationMask supportedOrientationsMask(ModalHostViewSupportedOrientationsMask mask)
{
  UIInterfaceOrientationMask supportedOrientations = 0;

  if (mask & ModalHostViewSupportedOrientations::Portrait) {
    supportedOrientations |= UIInterfaceOrientationMaskPortrait;
  }

  if (mask & ModalHostViewSupportedOrientations::PortraitUpsideDown) {
    supportedOrientations |= UIInterfaceOrientationMaskPortraitUpsideDown;
  }

  if (mask & ModalHostViewSupportedOrientations::Landscape) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscape;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeLeft) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeLeft;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeRight) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeRight;
  }

  if (supportedOrientations == 0) {
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
      return UIInterfaceOrientationMaskAll;
    } else {
      return UIInterfaceOrientationMaskPortrait;
    }
  }

  return supportedOrientations;
}

static std::tuple<BOOL, UIModalTransitionStyle> animationConfiguration(ModalHostViewAnimationType const animation)
{
  switch (animation) {
    case ModalHostViewAnimationType::None:
      return std::make_tuple(NO, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Slide:
      return std::make_tuple(YES, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Fade:
      return std::make_tuple(YES, UIModalTransitionStyleCrossDissolve);
  }
}

static UIModalPresentationStyle presentationConfiguration(ModalHostViewProps const &props)
{
  if (props.transparent) {
    return UIModalPresentationOverFullScreen;
  }
  switch (props.presentationStyle) {
    case ModalHostViewPresentationStyle::FullScreen:
      return UIModalPresentationFullScreen;
    case ModalHostViewPresentationStyle::PageSheet:
      return UIModalPresentationPageSheet;
    case ModalHostViewPresentationStyle::FormSheet:
      return UIModalPresentationFormSheet;
    case ModalHostViewPresentationStyle::OverFullScreen:
      return UIModalPresentationOverFullScreen;
  }
}

static ModalHostViewEventEmitter::OnOrientationChange onOrientationChangeStruct(CGRect rect)
{
  ;
  auto orientation = rect.size.width < rect.size.height
      ? ModalHostViewEventEmitter::OnOrientationChangeOrientation::Portrait
      : ModalHostViewEventEmitter::OnOrientationChangeOrientation::Landscape;
  return {orientation};
}

@interface ABI47_0_0RCTModalHostViewComponentView () <ABI47_0_0RCTFabricModalHostViewControllerDelegate>

@end

@implementation ABI47_0_0RCTModalHostViewComponentView {
  ABI47_0_0RCTFabricModalHostViewController *_viewController;
  ModalHostViewShadowNode::ConcreteState::Shared _state;
  BOOL _shouldAnimatePresentation;
  BOOL _shouldPresent;
  BOOL _isPresented;
  UIView *_modalContentsSnapshot;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ModalHostViewProps>();
    _props = defaultProps;
    _shouldAnimatePresentation = YES;

    _isPresented = NO;
  }

  return self;
}

- (ABI47_0_0RCTFabricModalHostViewController *)viewController
{
  if (!_viewController) {
    _viewController = [ABI47_0_0RCTFabricModalHostViewController new];
    _viewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    _viewController.delegate = self;
  }
  return _viewController;
}

- (void)presentViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  UIViewController *controller = [self ABI47_0_0ReactViewController];
  [controller presentViewController:modalViewController animated:animated completion:completion];
}

- (void)dismissViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  [modalViewController dismissViewControllerAnimated:animated completion:completion];
}

- (void)ensurePresentedOnlyIfNeeded
{
  BOOL shouldBePresented = !_isPresented && _shouldPresent && self.window;
  if (shouldBePresented) {
    _isPresented = YES;
    [self presentViewController:self.viewController
                       animated:_shouldAnimatePresentation
                     completion:^{
                       auto eventEmitter = [self modalEventEmitter];
                       if (eventEmitter) {
                         eventEmitter->onShow(ModalHostViewEventEmitter::OnShow{});
                       }
                     }];
  }

  BOOL shouldBeHidden = _isPresented && (!_shouldPresent || !self.superview);
  if (shouldBeHidden) {
    _isPresented = NO;
    // To animate dismissal of view controller, snapshot of
    // view hierarchy needs to be added to the UIViewController.
    UIView *snapshot = _modalContentsSnapshot;
    [self.viewController.view addSubview:snapshot];

    [self dismissViewController:self.viewController
                       animated:_shouldAnimatePresentation
                     completion:^{
                       [snapshot removeFromSuperview];
                       auto eventEmitter = [self modalEventEmitter];
                       if (eventEmitter) {
                         eventEmitter->onDismiss(ModalHostViewEventEmitter::OnDismiss{});
                       }
                     }];
  }
}

- (std::shared_ptr<const ModalHostViewEventEmitter>)modalEventEmitter
{
  if (!self->_eventEmitter) {
    return nullptr;
  }

  assert(std::dynamic_pointer_cast<ModalHostViewEventEmitter const>(self->_eventEmitter));
  return std::static_pointer_cast<ModalHostViewEventEmitter const>(self->_eventEmitter);
}

#pragma mark - ABI47_0_0RCTMountingTransactionObserving

- (void)mountingTransactionWillMount:(MountingTransaction const &)transaction
                withSurfaceTelemetry:(ABI47_0_0facebook::ABI47_0_0React::SurfaceTelemetry const &)surfaceTelemetry
{
  _modalContentsSnapshot = [self.viewController.view snapshotViewAfterScreenUpdates:NO];
}

#pragma mark - UIView methods

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self ensurePresentedOnlyIfNeeded];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [self ensurePresentedOnlyIfNeeded];
}

#pragma mark - ABI47_0_0RCTFabricModalHostViewControllerDelegate

- (void)boundsDidChange:(CGRect)newBounds
{
  auto eventEmitter = [self modalEventEmitter];
  if (eventEmitter) {
    eventEmitter->onOrientationChange(onOrientationChangeStruct(newBounds));
  }

  if (_state != nullptr) {
    auto newState = ModalHostViewState{ABI47_0_0RCTSizeFromCGSize(newBounds.size)};
    _state->updateState(std::move(newState));
  }
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _viewController = nil;
  _isPresented = NO;
  _shouldPresent = NO;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ModalHostViewProps>(props);

#if !TARGET_OS_TV
  self.viewController.supportedInterfaceOrientations = supportedOrientationsMask(newProps.supportedOrientations);
#endif

  auto const [shouldAnimate, transitionStyle] = animationConfiguration(newProps.animationType);
  _shouldAnimatePresentation = shouldAnimate;
  self.viewController.modalTransitionStyle = transitionStyle;

  self.viewController.modalPresentationStyle = presentationConfiguration(newProps);

  _shouldPresent = newProps.visible;
  [self ensurePresentedOnlyIfNeeded];

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(ABI47_0_0facebook::ABI47_0_0React::State::Shared const &)state
           oldState:(ABI47_0_0facebook::ABI47_0_0React::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const ModalHostViewShadowNode::ConcreteState>(state);
}

- (void)mountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [self.viewController.view insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RCTModalHostViewCls(void);

#ifdef __cplusplus
}
#endif

Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RCTModalHostViewCls(void)
{
  return ABI47_0_0RCTModalHostViewComponentView.class;
}
