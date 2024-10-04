/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/imagemanager/ImageInstrumentation.h>
#include <ABI42_0_0React/imagemanager/ImageResponse.h>
#include <ABI42_0_0React/imagemanager/ImageResponseObserver.h>
#include <ABI42_0_0React/imagemanager/ImageResponseObserverCoordinator.h>
#include <ABI42_0_0React/imagemanager/primitives.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

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
      const ImageSource &imageSource,
      std::shared_ptr<const ImageInstrumentation> instrumentation);

  /*
   * The move constructor.
   */
  ImageRequest(ImageRequest &&other) noexcept;

  /*
   * `ImageRequest` does not support copying by design.
   */
  ImageRequest(const ImageRequest &other) = delete;

  ~ImageRequest();

  /**
   * Set cancelation function.
   */
  void setCancelationFunction(std::function<void(void)> cancelationFunction);

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
   * Returns stored image instrumentation object as a shared pointer.
   * Retain this *or* `ImageRequest` to ensure a correct lifetime of the object.
   */
  const std::shared_ptr<const ImageInstrumentation>
      &getSharedImageInstrumentation() const;

  /*
   * Returns the image instrumentation object specific to this request.
   * Use this if a correct lifetime of the object is ensured in some other way
   * (e.g. by retaining an `ImageRequest`).
   */
  const ImageInstrumentation &getImageInstrumentation() const;

 private:
  /*
   * Image source associated with the request.
   */
  ImageSource imageSource_;

  /*
   * Event coordinator associated with the reqest.
   */
  std::shared_ptr<const ImageResponseObserverCoordinator> coordinator_{};

  /*
   * Image instrumentation specific to the request.
   */
  std::shared_ptr<const ImageInstrumentation> instrumentation_;

  /*
   * Function we can call to cancel image request (see destructor).
   */
  std::function<void(void)> cancelRequest_;

  /*
   * Indicates that the object was moved and hence cannot be used anymore.
   */
  bool moved_{false};
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
