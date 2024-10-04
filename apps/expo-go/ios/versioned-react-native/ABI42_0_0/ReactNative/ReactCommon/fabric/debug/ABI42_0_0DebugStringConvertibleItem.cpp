/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0DebugStringConvertibleItem.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE

DebugStringConvertibleItem::DebugStringConvertibleItem(
    const std::string &name,
    const std::string &value,
    const SharedDebugStringConvertibleList &props,
    const SharedDebugStringConvertibleList &children)
    : name_(name), value_(value), debugProps_(props), children_(children) {}

std::string DebugStringConvertibleItem::getDebugName() const {
  return name_;
}

std::string DebugStringConvertibleItem::getDebugValue() const {
  return value_;
}

SharedDebugStringConvertibleList DebugStringConvertibleItem::getDebugProps()
    const {
  return debugProps_;
}

SharedDebugStringConvertibleList DebugStringConvertibleItem::getDebugChildren()
    const {
  return children_;
}

#endif

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
