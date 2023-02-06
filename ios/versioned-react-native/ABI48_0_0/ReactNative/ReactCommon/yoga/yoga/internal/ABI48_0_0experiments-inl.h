/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI48_0_0experiments.h"

#include <bitset>

namespace ABI48_0_0facebook {
namespace yoga {
namespace internal {

namespace detail {
extern std::bitset<sizeof(int)> enabledExperiments;
} // namespace detail

inline bool isEnabled(Experiment experiment) {
  return detail::enabledExperiments.test(static_cast<size_t>(experiment));
}

inline void disableAllExperiments() {
  detail::enabledExperiments = 0;
}

} // namespace internal
} // namespace yoga
} // namespace ABI48_0_0facebook
