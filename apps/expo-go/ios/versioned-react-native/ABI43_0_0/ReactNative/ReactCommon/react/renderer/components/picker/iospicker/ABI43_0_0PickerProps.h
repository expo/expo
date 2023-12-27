/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/primitives.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/text/BaseTextProps.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewProps.h>

#include <vector>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class PickerProps final : public ViewProps, public BaseTextProps {
 public:
  PickerProps() = default;
  PickerProps(PickerProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  std::vector<PickerItemsStruct> items{};
  int selectedIndex{0};
  std::string const testID{};
  std::string const accessibilityLabel{};

#pragma mark - Accessors
  TextAttributes getEffectiveTextAttributes() const;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
