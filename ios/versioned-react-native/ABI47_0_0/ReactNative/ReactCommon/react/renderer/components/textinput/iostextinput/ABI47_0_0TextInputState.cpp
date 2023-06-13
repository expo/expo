/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0TextInputState.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

#ifdef ANDROID
TextInputState::TextInputState(
    TextInputState const &previousState,
    folly::dynamic const &data){};

/*
 * Empty implementation for Android because it doesn't use this class.
 */
folly::dynamic TextInputState::getDynamic() const {
  return {};
};

/*
 * Empty implementation for Android because it doesn't use this class.
 */
MapBuffer TextInputState::getMapBuffer() const {
  return MapBufferBuilder::EMPTY();
};
#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
