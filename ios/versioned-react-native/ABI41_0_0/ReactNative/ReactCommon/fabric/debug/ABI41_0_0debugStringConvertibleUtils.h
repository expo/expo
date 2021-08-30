/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>
#include <string>
#include <vector>

#include <ABI41_0_0React/debug/DebugStringConvertible.h>
#include <ABI41_0_0React/debug/DebugStringConvertibleItem.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE

template <typename T>
inline SharedDebugStringConvertible
debugStringConvertibleItem(std::string name, T value, T defaultValue = {}) {
  if (value == defaultValue) {
    return nullptr;
  }

  return std::make_shared<DebugStringConvertibleItem>(name, toString(value));
}

template <typename T>
inline SharedDebugStringConvertible debugStringConvertibleItem(
    std::string name,
    folly::Optional<T> value,
    T defaultValue = {}) {
  if (!value.hasValue()) {
    return nullptr;
  }

  return debugStringConvertibleItem(
      name, value.value_or(defaultValue), defaultValue);
}

inline SharedDebugStringConvertibleList operator+(
    const SharedDebugStringConvertibleList &lhs,
    const SharedDebugStringConvertibleList &rhs) {
  auto result = SharedDebugStringConvertibleList{};
  std::move(lhs.begin(), lhs.end(), std::back_inserter(result));
  std::move(rhs.begin(), rhs.end(), std::back_inserter(result));
  return result;
}

inline SharedDebugStringConvertible debugStringConvertibleItem(
    std::string name,
    DebugStringConvertible value,
    std::string defaultValue) {
  return debugStringConvertibleItem(
      name, value.getDebugDescription(), defaultValue);
}

#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
