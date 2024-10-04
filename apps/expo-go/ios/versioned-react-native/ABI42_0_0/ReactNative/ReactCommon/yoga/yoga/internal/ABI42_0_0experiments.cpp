/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0experiments.h"
#include "ABI42_0_0experiments-inl.h"

namespace ABI42_0_0facebook {
namespace yoga {
namespace internal {

namespace detail {

std::bitset<sizeof(int)> enabledExperiments = 0;

} // namespace detail

void enable(Experiment experiment) {
  detail::enabledExperiments.set(static_cast<size_t>(experiment));
}

void disable(Experiment experiment) {
  detail::enabledExperiments.reset(static_cast<size_t>(experiment));
}

bool toggle(Experiment experiment) {
  auto bit = static_cast<size_t>(experiment);
  auto previousState = detail::enabledExperiments.test(bit);
  detail::enabledExperiments.flip(bit);
  return previousState;
}

} // namespace internal
} // namespace yoga
} // namespace ABI42_0_0facebook
