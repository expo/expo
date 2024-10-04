/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/graphics/Float.h>
#include <ABI42_0_0React/graphics/Geometry.h>
#include <ABI42_0_0React/graphics/conversions.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

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
      : screenSize(Size{(Float)data["screenWidth"].getDouble(),
                        (Float)data["screenHeight"].getDouble()}){};
#endif

  const Size screenSize{};

#ifdef ANDROID
  folly::dynamic getDynamic() const;
#endif

#pragma mark - Getters
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
