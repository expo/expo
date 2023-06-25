/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0graphicsConversions.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Float.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBuffer.h>
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBufferBuilder.h>
#endif

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * State for <ModalHostView> component.
 */
class ModalHostViewState final {
 public:
  using Shared = std::shared_ptr<const ModalHostViewState>;

  ModalHostViewState(){};
  ModalHostViewState(Size screenSize_) : screenSize(screenSize_){};

#ifdef ANDROID
  ModalHostViewState(
      ModalHostViewState const &previousState,
      folly::dynamic data)
      : screenSize(Size{
            (Float)data["screenWidth"].getDouble(),
            (Float)data["screenHeight"].getDouble()}){};
#endif

  const Size screenSize{};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };

#endif

#pragma mark - Getters
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
