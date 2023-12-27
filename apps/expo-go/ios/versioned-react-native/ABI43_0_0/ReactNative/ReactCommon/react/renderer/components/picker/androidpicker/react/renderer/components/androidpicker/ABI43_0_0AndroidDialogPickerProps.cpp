/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0AndroidDialogPickerProps.h"

#include <ABI43_0_0React/ABI43_0_0renderer/components/image/conversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/propsConversions.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

AndroidDialogPickerProps::AndroidDialogPickerProps(
    const AndroidDialogPickerProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps),
      color(convertRawProp(rawProps, "color", sourceProps.color, {})),
      enabled(convertRawProp(rawProps, "enabled", sourceProps.enabled, {true})),
      items(convertRawProp(rawProps, "items", sourceProps.items, {})),
      prompt(convertRawProp(rawProps, "prompt", sourceProps.prompt, {""})),
      selected(
          convertRawProp(rawProps, "selected", sourceProps.selected, {0})) {}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
