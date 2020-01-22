/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Hash.h>
#include <ReactABI34_0_0/core/LayoutPrimitives.h>
#include <ReactABI34_0_0/graphics/Geometry.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize{0, 0};
  Size maximumSize{kFloatUndefined, kFloatUndefined};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
};

inline bool operator==(
    const LayoutConstraints &lhs,
    const LayoutConstraints &rhs) {
  return std::tie(lhs.minimumSize, lhs.maximumSize, lhs.layoutDirection) ==
      std::tie(rhs.minimumSize, rhs.maximumSize, rhs.layoutDirection);
}

} // namespace ReactABI34_0_0
} // namespace facebook

namespace std {
template <>
struct hash<facebook::ReactABI34_0_0::LayoutConstraints> {
  size_t operator()(
      const facebook::ReactABI34_0_0::LayoutConstraints &constraints) const {
    auto seed = size_t{0};
    folly::hash::hash_combine(
        seed,
        constraints.minimumSize,
        constraints.maximumSize,
        constraints.layoutDirection);
    return seed;
  }
};
} // namespace std
