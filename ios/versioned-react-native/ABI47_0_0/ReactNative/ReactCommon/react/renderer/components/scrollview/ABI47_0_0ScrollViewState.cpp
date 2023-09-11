/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0ScrollViewState.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

Size ScrollViewState::getContentSize() const {
  return contentBoundingRect.size;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
