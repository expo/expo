/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0AndroidDropdownPickerProps.h"

#include <ABI44_0_0React/ABI44_0_0renderer/components/image/conversions.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/propsConversions.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

AndroidDropdownPickerProps::AndroidDropdownPickerProps(
    const AndroidDropdownPickerProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      color(convertRawProp(rawProps, "color", sourceProps.color, {})),
      enabled(convertRawProp(rawProps, "enabled", sourceProps.enabled, {true})),
      items(convertRawProp(rawProps, "items", sourceProps.items, {})),
      prompt(convertRawProp(rawProps, "prompt", sourceProps.prompt, {""})),
      selected(
          convertRawProp(rawProps, "selected", sourceProps.selected, {0})) {}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
