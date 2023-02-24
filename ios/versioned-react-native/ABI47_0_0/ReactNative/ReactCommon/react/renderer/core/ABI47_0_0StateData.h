/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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
  MapBuffer getMapBuffer() const;
#endif
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
