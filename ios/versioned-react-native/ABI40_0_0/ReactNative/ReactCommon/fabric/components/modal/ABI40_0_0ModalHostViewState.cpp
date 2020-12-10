/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI40_0_0ModalHostViewState.h"

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

#ifdef ANDROID
folly::dynamic ModalHostViewState::getDynamic() const {
  return folly::dynamic::object("screenWidth", screenSize.width)(
      "screenHeight", screenSize.height);
}
#endif

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
