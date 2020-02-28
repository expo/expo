/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ImageManager.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

ImageManager::ImageManager(ContextContainer::Shared const &contextContainer) {
  // Silence unused-private-field warning.
  (void)self_;
  // Not implemented.
}

ImageManager::~ImageManager() {
  // Not implemented.
}

ImageRequest ImageManager::requestImage(const ImageSource &imageSource) const {
  // Not implemented.
  return ImageRequest(imageSource);
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
