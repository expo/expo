/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0DynamicPropsUtilities.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {
folly::dynamic mergeDynamicProps(
    folly::dynamic const &source,
    folly::dynamic const &patch) {
  auto result = source;

  if (!result.isObject()) {
    result = folly::dynamic::object();
  }

  if (!patch.isObject()) {
    return result;
  }

  // Note, here we have to preserve sub-prop objects with `null` value as
  // an indication for the legacy mounting layer that it needs to clean them up.
  for (auto const &pair : patch.items()) {
    result[pair.first] = pair.second;
  }

  return result;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
