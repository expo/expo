/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTSafeAreaViewComponentView.h"

#import <ABI44_0_0React/ABI44_0_0RCTUtils.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/components/safeareaview/SafeAreaViewState.h>
#import "ABI44_0_0RCTConversions.h"
#import "ABI44_0_0RCTFabricComponentsPlugins.h"

using namespace ABI44_0_0facebook::ABI44_0_0React;

@implementation ABI44_0_0RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteStateTeller _stateTeller;
  EdgeInsets _lastPaddingStateWasUpdatedWith;
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
  UIEdgeInsets insets = [self _safeAreaInsets];
  insets.left = ABI44_0_0RCTRoundPixelValue(insets.left);
  insets.top = ABI44_0_0RCTRoundPixelValue(insets.top);
  insets.right = ABI44_0_0RCTRoundPixelValue(insets.right);
  insets.bottom = ABI44_0_0RCTRoundPixelValue(insets.bottom);

  auto newPadding = ABI44_0_0RCTEdgeInsetsFromUIEdgeInsets(insets);
  auto threshold = 1.0 / ABI44_0_0RCTScreenScale() + 0.01; // Size of a pixel plus some small threshold.
  auto deltaPadding = newPadding - _lastPaddingStateWasUpdatedWith;

  if (std::abs(deltaPadding.left) < threshold && std::abs(deltaPadding.top) < threshold &&
      std::abs(deltaPadding.right) < threshold && std::abs(deltaPadding.bottom) < threshold) {
    return;
  }

  _lastPaddingStateWasUpdatedWith = newPadding;
  _stateTeller.updateState(SafeAreaViewState{newPadding});
}

#pragma mark - ABI44_0_0RCTComponentViewProtocol

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _stateTeller.setConcreteState(state);
  [self _updateStateIfNecessary];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _stateTeller.invalidate();
  _lastPaddingStateWasUpdatedWith = {};
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

@end

Class<ABI44_0_0RCTComponentViewProtocol> ABI44_0_0RCTSafeAreaViewCls(void)
{
  return ABI44_0_0RCTSafeAreaViewComponentView.class;
}
