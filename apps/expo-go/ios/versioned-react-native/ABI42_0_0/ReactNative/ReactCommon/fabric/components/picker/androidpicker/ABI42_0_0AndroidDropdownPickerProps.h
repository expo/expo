/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/components/view/ViewProps.h>
#include <ABI42_0_0React/core/propsConversions.h>
#include <ABI42_0_0React/graphics/Color.h>
#include <ABI42_0_0React/imagemanager/primitives.h>
#include <cinttypes>
#include <vector>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

struct AndroidDropdownPickerItemsStruct {
  std::string label;
  int color;
};

static inline void fromRawValue(
    const RawValue &value,
    AndroidDropdownPickerItemsStruct &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto label = map.find("label");
  if (label != map.end()) {
    fromRawValue(label->second, result.label);
  }
  auto color = map.find("color");
  // C++ props are not used on Android at the moment, so we can leave
  // result.color uninitialized if the JS prop has a null value. TODO: revisit
  // this once we start using C++ props on Android.
  if (color != map.end() && color->second.hasValue()) {
    fromRawValue(color->second, result.color);
  }
}

static inline std::string toString(
    const AndroidDropdownPickerItemsStruct &value) {
  return "[Object AndroidDropdownPickerItemsStruct]";
}

static inline void fromRawValue(
    const RawValue &value,
    std::vector<AndroidDropdownPickerItemsStruct> &result) {
  auto items = (std::vector<RawValue>)value;
  for (const auto &item : items) {
    AndroidDropdownPickerItemsStruct newItem;
    fromRawValue(item, newItem);
    result.emplace_back(newItem);
  }
}

class AndroidDropdownPickerProps final : public ViewProps {
 public:
  AndroidDropdownPickerProps() = default;

  AndroidDropdownPickerProps(
      const AndroidDropdownPickerProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const SharedColor color{};
  const bool enabled{true};
  const std::vector<AndroidDropdownPickerItemsStruct> items{};
  const std::string prompt{""};
  const int selected{0};
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
