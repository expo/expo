/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Float.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Geometry.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/conversions.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI45_0_0React/ABI45_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI45_0_0React/ABI45_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

/*
 * State for <BottomSheetView> component.
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

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
