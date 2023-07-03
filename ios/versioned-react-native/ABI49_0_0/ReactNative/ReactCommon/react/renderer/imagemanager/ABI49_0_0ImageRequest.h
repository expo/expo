/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponse.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponseObserver.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponseObserverCoordinator.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageTelemetry.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0primitives.h>
#include <ABI49_0_0React/utils/ABI49_0_0SharedFunction.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Represents ongoing request for an image resource.
 * The separate object must be constructed for every single separate
 * image request. The object cannot be copied because it would make managing of
 * event listeners hard and inefficient; the object can be moved though.
 * Destroy to cancel the underlying request.
 */
class ImageRequest final {
 public:
  /*
   * The default constructor
   */
  ImageRequest(
      ImageSource imageSource,
      std::shared_ptr<const ImageTelemetry> telemetry,
      SharedFunction<> cancelationFunction);

  /*
   * The move constructor.
   */
  ImageRequest(ImageRequest &&other) noexcept = default;

  /*
   * `ImageRequest` does not support copying by design.
   */
  ImageRequest(const ImageRequest &other) = delete;

  /*
   * Calls cancel function if one is defined. Should be when downloading
   * image isn't needed anymore. E.g. <ImageView /> was removed.
   */
  void cancel() const;

  /*
   * Returns the Image Source associated with the request.
   */
  const ImageSource &getImageSource() const;

  /*
   * Returns stored observer coordinator as a shared pointer.
   * Retain this *or* `ImageRequest` to ensure a correct lifetime of the object.
   */
  const std::shared_ptr<const ImageResponseObserverCoordinator>
      &getSharedObserverCoordinator() const;

  /*
   * Returns stored observer coordinator as a reference.
   * Use this if a correct lifetime of the object is ensured in some other way
   * (e.g. by retaining an `ImageRequest`).
   */
  const ImageResponseObserverCoordinator &getObserverCoordinator() const;

  /*
   * Returns stored image telemetry object as a shared pointer.
   * Retain this *or* `ImageRequest` to ensure a correct lifetime of the object.
   */
  const std::shared_ptr<const ImageTelemetry> &getSharedTelemetry() const;

 private:
  /*
   * Image source associated with the request.
   */
  ImageSource imageSource_;

  /*
   * Image telemetry associated with the request.
   */
  std::shared_ptr<const ImageTelemetry> telemetry_{};

  /*
   * Event coordinator associated with the request.
   */
  std::shared_ptr<const ImageResponseObserverCoordinator> coordinator_{};

  /*
   * Function we can call to cancel image request.
   */
  SharedFunction<> cancelRequest_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
