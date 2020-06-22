/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSafeAreaViewComponentView.h"

#import <ABI38_0_0React/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#import <ABI38_0_0React/components/safeareaview/SafeAreaViewState.h>
#import "ABI38_0_0FBABI38_0_0RCTFabricComponentsPlugins.h"
#import "ABI38_0_0RCTConversions.h"
#import "ABI38_0_0RCTFabricComponentsPlugins.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@implementation ABI38_0_0RCTSafeAreaViewComponentView {
  SafeAreaViewShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SafeAreaViewProps>();
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
  if (_state != nullptr) {
    auto newState = SafeAreaViewState{ABI38_0_0RCTEdgeInsetsFromUIEdgeInsets(self._safeAreaInsets)};
    _state->updateState(std::move(newState));
  }
}

#pragma mark - ABI38_0_0RCTComponentViewProtocol

- (void)updateState:(ABI38_0_0facebook::ABI38_0_0React::State::Shared const &)state
           oldState:(ABI38_0_0facebook::ABI38_0_0React::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const SafeAreaViewShadowNode::ConcreteState>(state);
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>();
}

@end

Class<ABI38_0_0RCTComponentViewProtocol> ABI38_0_0RCTSafeAreaViewCls(void)
{
  return ABI38_0_0RCTSafeAreaViewComponentView.class;
}
