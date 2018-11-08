/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/activityindicator/primitives.h>
#include <folly/dynamic.h>

namespace facebook {
namespace ReactABI31_0_0 {

inline void fromDynamic(const folly::dynamic &value, ActivityIndicatorViewSize &result) {
  auto string = value.asString();
  if (string == "large") { result = ActivityIndicatorViewSize::Large; return; }
  if (string == "small") { result = ActivityIndicatorViewSize::Small; return; }
  abort();
}

inline std::string toString(const ActivityIndicatorViewSize &value) {
  switch (value) {
    case ActivityIndicatorViewSize::Large: return "large";
    case ActivityIndicatorViewSize::Small: return "small";
  }
}

} // namespace ReactABI31_0_0
} // namespace facebook
