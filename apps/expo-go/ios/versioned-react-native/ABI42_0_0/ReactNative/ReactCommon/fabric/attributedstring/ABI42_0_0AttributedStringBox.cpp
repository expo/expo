/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0AttributedStringBox.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

AttributedStringBox::AttributedStringBox()
    : mode_(Mode::Value),
      value_(std::make_shared<AttributedString const>(AttributedString{})),
      opaquePointer_({}){};

AttributedStringBox::AttributedStringBox(AttributedString const &value)
    : mode_(Mode::Value),
      value_(std::make_shared<AttributedString const>(value)),
      opaquePointer_({}){};

AttributedStringBox::AttributedStringBox(
    std::shared_ptr<void> const &opaquePointer)
    : mode_(Mode::OpaquePointer), value_({}), opaquePointer_(opaquePointer) {}

AttributedStringBox::Mode AttributedStringBox::getMode() const {
  return mode_;
}

AttributedString const &AttributedStringBox::getValue() const {
  assert(mode_ == AttributedStringBox::Mode::Value);
  assert(value_);
  return *value_;
}

std::shared_ptr<void> AttributedStringBox::getOpaquePointer() const {
  assert(mode_ == AttributedStringBox::Mode::OpaquePointer);
  assert(opaquePointer_);
  return opaquePointer_;
}

bool operator==(
    AttributedStringBox const &lhs,
    AttributedStringBox const &rhs) {
  if (lhs.getMode() != rhs.getMode()) {
    return false;
  }

  switch (lhs.getMode()) {
    case ABI42_0_0facebook::ABI42_0_0React::AttributedStringBox::Mode::Value:
      return lhs.getValue() == rhs.getValue();
    case ABI42_0_0facebook::ABI42_0_0React::AttributedStringBox::Mode::OpaquePointer:
      return lhs.getOpaquePointer() == rhs.getOpaquePointer();
  }
}

bool operator!=(
    AttributedStringBox const &lhs,
    AttributedStringBox const &rhs) {
  return !(lhs == rhs);
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
