/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ModalHostViewState.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

#ifdef ANDROID
folly::dynamic ModalHostViewState::getDynamic() const {
  return folly::dynamic::object("screenWidth", screenSize.width)(
      "screenHeight", screenSize.height);
}
#endif

} // namespace ABI49_0_0facebook::ABI49_0_0React
