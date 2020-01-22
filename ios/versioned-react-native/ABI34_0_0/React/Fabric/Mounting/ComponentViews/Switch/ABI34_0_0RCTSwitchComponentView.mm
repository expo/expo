/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTSwitchComponentView.h"

#import <ReactABI34_0_0/components/rncore/EventEmitters.h>
#import <ReactABI34_0_0/components/rncore/Props.h>
#import <ReactABI34_0_0/components/rncore/ShadowNodes.h>

using namespace facebook::ReactABI34_0_0;

@implementation ABI34_0_0RCTSwitchComponentView {
  UISwitch *_switchView;
  BOOL _wasOn;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SwitchProps>();
    _props = defaultProps;

    _switchView = [[UISwitch alloc] initWithFrame:self.bounds];

    [_switchView addTarget:self
                    action:@selector(onChange:)
          forControlEvents:UIControlEventValueChanged];

    _switchView.on = defaultProps->value;

    self.contentView = _switchView;
  }

  return self;
}

#pragma mark - ABI34_0_0RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return SwitchShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldSwitchProps = *std::static_pointer_cast<const SwitchProps>(oldProps ?: _props);
  const auto &newSwitchProps = *std::static_pointer_cast<const SwitchProps>(props);

  [super updateProps:props oldProps:oldProps];

  // `value`
  if (oldSwitchProps.value != newSwitchProps.value) {
    _switchView.on = newSwitchProps.value;
    _wasOn = newSwitchProps.value;
  }

  // `disabled`
  if (oldSwitchProps.disabled != newSwitchProps.disabled) {
    _switchView.enabled = !newSwitchProps.disabled;
  }

  // `tintColor`
  if (oldSwitchProps.tintColor != newSwitchProps.tintColor) {
    _switchView.tintColor = [UIColor colorWithCGColor:newSwitchProps.tintColor.get()];
  }

  // `onTintColor
  if (oldSwitchProps.onTintColor != newSwitchProps.onTintColor) {
    _switchView.onTintColor = [UIColor colorWithCGColor:newSwitchProps.onTintColor.get()];
  }

  // `thumbTintColor`
  if (oldSwitchProps.thumbTintColor != newSwitchProps.thumbTintColor) {
    _switchView.thumbTintColor = [UIColor colorWithCGColor:newSwitchProps.thumbTintColor.get()];
  }
}

- (void)onChange:(UISwitch *)sender
{
  if (_wasOn == sender.on) {
    return;
  }
  _wasOn = sender.on;

  std::dynamic_pointer_cast<const SwitchEventEmitter>(_eventEmitter)->onChange(SwitchOnChangeStruct{.value=static_cast<bool>(sender.on)});
}

@end
