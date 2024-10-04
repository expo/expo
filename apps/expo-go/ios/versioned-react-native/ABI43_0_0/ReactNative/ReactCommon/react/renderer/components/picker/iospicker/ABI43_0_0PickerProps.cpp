/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0PickerProps.h"

#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/conversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/conversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/propsConversions.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

PickerProps::PickerProps(
    PickerProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      BaseTextProps(sourceProps, rawProps),
      items(convertRawProp(rawProps, "items", sourceProps.items, {})),
      selectedIndex(convertRawProp(
          rawProps,
          "selectedIndex",
          sourceProps.selectedIndex,
          {0})),
      testID(convertRawProp(rawProps, "testID", sourceProps.testID, {})),
      accessibilityLabel(convertRawProp(
          rawProps,
          "accessibilityLabel",
          sourceProps.accessibilityLabel,
          {})){

      };

TextAttributes PickerProps::getEffectiveTextAttributes() const {
  auto result = TextAttributes::defaultTextAttributes();
  // Default is left aligned, but Picker wants default to be center aligned.
  result.alignment = TextAlignment::Center;
  result.apply(textAttributes);
  return result;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
