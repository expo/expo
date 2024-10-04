/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponse.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponseObserver.h>

#include <ABI49_0_0butter/ABI49_0_0small_vector.h>
#include <mutex>
#include <vector>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * The ImageResponseObserverCoordinator receives events and completed image
 * data from native image loaders and sends events to any observers attached
 * to the coordinator. The Coordinator also keeps track of response status
 * and caches completed images.
 */
class ImageResponseObserverCoordinator {
 public:
  /*
   * Interested parties may observe the image response.
   * If the current image request status is not equal to `Loading`, the observer
   * will be called immediately.
   */
  void addObserver(ImageResponseObserver const &observer) const;

  /*
   * Interested parties may stop observing the image response.
   */
  void removeObserver(ImageResponseObserver const &observer) const;

  /*
   * Platform-specific image loader will call this method with progress updates.
   */
  void nativeImageResponseProgress(float progress) const;

  /*
   * Platform-specific image loader will call this method with a completed image
   * response.
   */
  void nativeImageResponseComplete(ImageResponse const &imageResponse) const;

  /*
   * Platform-specific image loader will call this method in case of any
   * failures.
   */
  void nativeImageResponseFailed() const;

 private:
  /*
   * List of observers.
   * Mutable: protected by mutex_.
   */
  mutable butter::small_vector<ImageResponseObserver const *, 1> observers_;

  /*
   * Current status of image loading.
   * Mutable: protected by mutex_.
   */
  mutable ImageResponse::Status status_{ImageResponse::Status::Loading};

  /*
   * Cache image data.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageData_;

  /*
   * Cache image metadata.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageMetadata_;

  /*
   * Observer and data mutex.
   */
  mutable std::mutex mutex_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
