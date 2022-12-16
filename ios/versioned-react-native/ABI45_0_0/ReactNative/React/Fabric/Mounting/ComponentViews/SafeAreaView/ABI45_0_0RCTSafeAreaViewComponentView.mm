/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTSafeAreaViewComponentView.h"

#import <ABI45_0_0React/ABI45_0_0RCTUtils.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/safeareaview/SafeAreaViewState.h>
#import "ABI45_0_0RCTConversions.h"
#import "ABI45_0_0RCTFabricComponentsPlugins.h"

using namespace ABI45_0_0facebook::ABI45_0_0React;

@implementation ABI45_0_0RCTSafeAreaViewComponentView {
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
  if (@available(iOS 11.0, *)) {
    return self.safeAreaInsets;
  }

  return UIEdgeInsetsZero;
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
  insets.left = ABI45_0_0RCTRoundPixelValue(insets.left);
  insets.top = ABI45_0_0RCTRoundPixelValue(insets.top);
  insets.right = ABI45_0_0RCTRoundPixelValue(insets.right);
  insets.bottom = ABI45_0_0RCTRoundPixelValue(insets.bottom);

  auto newPadding = ABI45_0_0RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / ABI45_0_0RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.

  _state->updateState(
      [=](SafeAreaViewShadowNode::ConcreteState::Data const &oldData)
          -> SafeAreaViewShadowNode::ConcreteState::SharedData {
        auto oldPadding = oldData.padding;
        auto deltaPadding = newPadding - oldPadding;

        if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
            std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
          return nullptr;
        }

        auto newData = oldData;
        newData.padding = newPadding;
        return std::make_shared<SafeAreaViewShadowNode::ConcreteState::Data const>(newData);
      });
}

#pragma mark - ABI45_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

- (void)updateState:(ABI45_0_0facebook::ABI45_0_0React::State::Shared const &)state
           oldState:(ABI45_0_0facebook::ABI45_0_0React::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<SafeAreaViewShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(ABI45_0_0RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  [self _updateStateIfNecessary];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
}

@end

Class<ABI45_0_0RCTComponentViewProtocol> ABI45_0_0RCTSafeAreaViewCls(void)
{
  return ABI45_0_0RCTSafeAreaViewComponentView.class;
}
