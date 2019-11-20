/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ImageManager.h"

namespace facebook {
namespace ReactABI34_0_0 {

ImageManager::ImageManager(void *platformSpecificCounterpart) {
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

} // namespace ReactABI34_0_0
} // namespace facebook
