/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/graphics/Color.h>

#include <string>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

struct PickerItemsStruct {
  std::string label;
  std::string value;
  SharedColor textColor;

  bool operator==(const PickerItemsStruct &rhs) const {
    return (
        label == rhs.label && value == rhs.value && textColor == rhs.textColor);
  }
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
