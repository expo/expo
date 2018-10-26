/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI31_0_0fabric/ABI31_0_0components/switch/SwitchProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

SwitchProps::SwitchProps(const SwitchProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  value(convertRawProp(rawProps, "value", sourceProps.value, value)),
  disabled(convertRawProp(rawProps, "disabled", sourceProps.disabled, disabled)),
  tintColor(convertRawProp(rawProps, "tintColor", sourceProps.tintColor, tintColor)),
  onTintColor(convertRawProp(rawProps, "onTintColor", sourceProps.onTintColor, onTintColor)),
  thumbTintColor(convertRawProp(rawProps, "thumbTintColor", sourceProps.thumbTintColor, thumbTintColor)) {}

} // namespace ReactABI31_0_0
} // namespace facebook
