/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

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

  ImageResponse(std::shared_ptr<void> image, std::shared_ptr<void> metadata);

  std::shared_ptr<void> getImage() const;

  std::shared_ptr<void> getMetadata() const;

 private:
  std::shared_ptr<void> image_{};

  std::shared_ptr<void> metadata_{};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
