/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTSwitchComponentView.h"

#import <ABI31_0_0fabric/ABI31_0_0components/switch/SwitchEventEmitter.h>
#import <ABI31_0_0fabric/ABI31_0_0components/switch/SwitchProps.h>

using namespace facebook::ReactABI31_0_0;

@implementation ABI31_0_0RCTSwitchComponentView {
  UISwitch *_switchView;
  BOOL _wasOn;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _switchView = [[UISwitch alloc] initWithFrame:self.bounds];

    [_switchView addTarget:self
                 action:@selector(onChange:)
       forControlEvents:UIControlEventValueChanged];

    const auto &defaultProps = SwitchProps();

    _switchView.on = defaultProps.value;

    self.contentView = _switchView;
  }

  return self;
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  if (!oldProps) {
    oldProps = _props ?: std::make_shared<SwitchProps>();
  }
  _props = props;

  [super updateProps:props oldProps:oldProps];

  auto oldSwitchProps = *std::dynamic_pointer_cast<const SwitchProps>(oldProps);
  auto newSwitchProps = *std::dynamic_pointer_cast<const SwitchProps>(props);

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

  std::dynamic_pointer_cast<const SwitchEventEmitter>(_eventEmitter)->onChange(sender.on);
}

@end
