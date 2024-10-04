/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Dummy type that is used as a placeholder for state data for nodes that
 * don't have a state.
 */
struct StateData final {
  using Shared = std::shared_ptr<void const>;

#ifdef ANDROID
  StateData() = default;
  StateData(StateData const &previousState, folly::dynamic data){};
  folly::dynamic getDynamic() const;
#endif
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
