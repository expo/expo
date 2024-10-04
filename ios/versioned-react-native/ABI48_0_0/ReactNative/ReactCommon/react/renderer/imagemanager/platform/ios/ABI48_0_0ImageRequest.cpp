/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0ImageRequest.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

ImageRequest::ImageRequest(
    ImageSource imageSource,
    std::shared_ptr<const ImageTelemetry> telemetry)
    : imageSource_(std::move(imageSource)), telemetry_(std::move(telemetry)) {
  coordinator_ = std::make_shared<ImageResponseObserverCoordinator>();
}

ImageRequest::ImageRequest(ImageRequest &&other) noexcept
    : imageSource_(std::move(other.imageSource_)),
      telemetry_(std::move(other.telemetry_)),
      coordinator_(std::move(other.coordinator_)) {
  other.coordinator_ = nullptr;
  other.cancelRequest_ = nullptr;
  other.telemetry_ = nullptr;
  other.imageSource_ = {};
}

ImageRequest::~ImageRequest() {
  if (cancelRequest_) {
    cancelRequest_();
  }
}

void ImageRequest::setCancelationFunction(
    std::function<void(void)> cancelationFunction) {
  cancelRequest_ = cancelationFunction;
}

const ImageSource &ImageRequest::getImageSource() const {
  return imageSource_;
}

const std::shared_ptr<const ImageTelemetry> &ImageRequest::getSharedTelemetry()
    const {
  return telemetry_;
}

const ImageResponseObserverCoordinator &ImageRequest::getObserverCoordinator()
    const {
  return *coordinator_;
}

const std::shared_ptr<const ImageResponseObserverCoordinator>
    &ImageRequest::getSharedObserverCoordinator() const {
  return coordinator_;
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
