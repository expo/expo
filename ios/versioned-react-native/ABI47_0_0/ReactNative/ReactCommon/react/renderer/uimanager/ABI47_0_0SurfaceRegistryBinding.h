/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactPrimitives.h>

namespace ABI47_0_0facebook::ABI47_0_0React {

class SurfaceRegistryBinding final {
 public:
  SurfaceRegistryBinding() = delete;

  /*
   * Starts ABI47_0_0React Native Surface with given id, moduleName, and props.
   * Thread synchronization must be enforced externally.
   */
  static void startSurface(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &initalProps,
      DisplayMode displayMode);

  /*
   * Updates the ABI47_0_0React Native Surface identified with surfaceId and moduleName
   * with the given props.
   * Thread synchronization must be enforced externally.
   */
  static void setSurfaceProps(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &initalProps,
      DisplayMode displayMode);

  /*
   * Stops ABI47_0_0React Native Surface with given id.
   * Thread synchronization must be enforced externally.
   */
  static void stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId);
};

} // namespace ABI47_0_0facebook::ABI47_0_0React
