/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ImageRequest.h"

#include <utility>

namespace ABI49_0_0facebook::ABI49_0_0React {

ImageRequest::ImageRequest(
    ImageSource imageSource,
    std::shared_ptr<const ImageTelemetry> telemetry,
    SharedFunction<> cancelationFunction)
    : imageSource_(std::move(imageSource)),
      telemetry_(std::move(telemetry)),
      cancelRequest_(std::move(cancelationFunction)) {
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

} // namespace ABI49_0_0facebook::ABI49_0_0React
