/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSafeAreaViewComponentView.h"

#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0React/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <ABI41_0_0React/components/safeareaview/SafeAreaViewState.h>
#import "ABI41_0_0FBABI41_0_0RCTFabricComponentsPlugins.h"
#import "ABI41_0_0RCTConversions.h"
#import "ABI41_0_0RCTFabricComponentsPlugins.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

@implementation ABI41_0_0RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<SafeAreaViewProps const>();
    _props = defaultProps;
    self.clipsToBounds = YES;
  }

  return self;
}

- (UIEdgeInsets)_safeAreaInsets
{
  if (@available(iOS 11.0, tvOS 11.0, *)) {
    return self.safeAreaInsets;
  }

  return UIEdgeInsetsZero;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
}

- (void)safeAreaInsetsDidChange
{
  [super safeAreaInsetsDidChange];

  [self _updateStateIfNecessary];
}

- (void)_updateStateIfNecessary
{
  if (!_state) {
    return;
  }

  UIEdgeInsets insets = [self _safeAreaInsets];
  insets.left = ABI41_0_0RCTRoundPixelValue(insets.left);
  insets.top = ABI41_0_0RCTRoundPixelValue(insets.top);
  insets.right = ABI41_0_0RCTRoundPixelValue(insets.right);
  insets.bottom = ABI41_0_0RCTRoundPixelValue(insets.bottom);

  auto oldPadding = _state->getData().padding;
  auto newPadding = ABI41_0_0RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / ABI41_0_0RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.
  auto deltaPadding = newPadding - oldPadding;

  if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
      std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
    return;
  }

  _state->updateState(SafeAreaViewState{newPadding});
}

#pragma mark - ABI41_0_0RCTComponentViewProtocol

- (void)updateState:(ABI41_0_0facebook::ABI41_0_0React::State::Shared const &)state
           oldState:(ABI41_0_0facebook::ABI41_0_0React::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<SafeAreaViewShadowNode::ConcreteState const>(state);
  [self _updateStateIfNecessary];
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

@end

Class<ABI41_0_0RCTComponentViewProtocol> ABI41_0_0RCTSafeAreaViewCls(void)
{
  return ABI41_0_0RCTSafeAreaViewComponentView.class;
}
