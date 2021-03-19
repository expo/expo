/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * A base class for performing image loading instrumentation.
 * The actual instrumentation is app, platform, and image loader-specific.
 */
class ImageInstrumentation {
 public:
  virtual ~ImageInstrumentation() noexcept = default;

  /**
   * Mark that the image content is set on the native image component on screen.
   */
  virtual void didSetImage() const = 0;

  /**
   * Mark that the image view starts to be visible on screen.
   */
  virtual void didEnterVisibilityRange() const = 0;

  /**
   * Mark that the image view is no longer visible on screen.
   */
  virtual void didExitVisibilityRange() const = 0;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
