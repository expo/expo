/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ImageManager.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

ImageManager::ImageManager(
    ContextContainer::Shared const & /*contextContainer*/) {
  // Silence unused-private-field warning.
  (void)self_;
  // Not implemented.
}

ImageManager::~ImageManager() {
  // Not implemented.
}

ImageRequest ImageManager::requestImage(
    const ImageSource &imageSource,
    SurfaceId /*surfaceId*/) const {
  // Not implemented.
  return {imageSource, nullptr, {}};
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
