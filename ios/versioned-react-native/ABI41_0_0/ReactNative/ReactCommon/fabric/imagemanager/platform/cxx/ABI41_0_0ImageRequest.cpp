/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0ImageRequest.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

ImageRequest::ImageRequest(
    const ImageSource &imageSource,
    std::shared_ptr<const ImageInstrumentation> instrumentation)
    : imageSource_(imageSource), instrumentation_(instrumentation) {
  // Not implemented.
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      coordinator_(std::move(other.coordinator_)) {
  // Not implemented.
}

ImageRequest::~ImageRequest() {
  // Not implemented.
}

const ImageResponseObserverCoordinator &ImageRequest::getObserverCoordinator()
    const {
  // Not implemented
  abort();
}

const std::shared_ptr<const ImageResponseObserverCoordinator>
    &ImageRequest::getSharedObserverCoordinator() const {
  // Not implemented
  abort();
}

const std::shared_ptr<const ImageInstrumentation>
    &ImageRequest::getSharedImageInstrumentation() const {
  // Not implemented
  abort();
}

const ImageInstrumentation &ImageRequest::getImageInstrumentation() const {
  // Not implemented
  abort();
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
