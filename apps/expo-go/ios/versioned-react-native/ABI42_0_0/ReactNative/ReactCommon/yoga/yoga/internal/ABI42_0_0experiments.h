/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstddef>

namespace ABI42_0_0facebook {
namespace yoga {
namespace internal {

enum struct Experiment : size_t {
  kDoubleMeasureCallbacks,
};

void enable(Experiment);
void disable(Experiment);
bool toggle(Experiment);

} // namespace internal
} // namespace yoga
} // namespace ABI42_0_0facebook
