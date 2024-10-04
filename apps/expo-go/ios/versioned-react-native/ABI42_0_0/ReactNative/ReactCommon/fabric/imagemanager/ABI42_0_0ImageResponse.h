/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Represents retrieved image bitmap and any associated platform-specific info.
 */
class ImageResponse final {
 public:
  enum class Status {
    Loading,
    Completed,
    Failed,
  };

  ImageResponse(const std::shared_ptr<void> &image);

  std::shared_ptr<void> getImage() const;

 private:
  std::shared_ptr<void> image_{};
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
