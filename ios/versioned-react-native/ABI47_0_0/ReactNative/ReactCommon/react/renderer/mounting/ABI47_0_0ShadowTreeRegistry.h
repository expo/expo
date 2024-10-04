/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/map.h>
#include <butter/mutex.h>

#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mounting/ShadowTree.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Owning registry of `ShadowTree`s.
 */
class ShadowTreeRegistry final {
 public:
  ShadowTreeRegistry() = default;
  ~ShadowTreeRegistry();

  /*
   * Adds a `ShadowTree` instance to the registry.
   * The ownership of the instance is also transferred to the registry.
   * Can be called from any thread.
   */
  void add(std::unique_ptr<ShadowTree> &&shadowTree) const;

  /*
   * Removes a `ShadowTree` instance with given `surfaceId` from the registry
   * and returns it as a result.
   * The ownership of the instance is also transferred to the caller.
   * Returns `nullptr` if a `ShadowTree` with given `surfaceId` was not found.
   * Can be called from any thread.
   */
  std::unique_ptr<ShadowTree> remove(SurfaceId surfaceId) const;

  /*
   * Finds a `ShadowTree` instance with a given `surfaceId` in the registry and
   * synchronously calls the `callback` with a reference to the instance while
   * the mutex is being acquired.
   * Returns `true` if the registry has `ShadowTree` instance with corresponding
   * `surfaceId`, otherwise returns `false` without calling the `callback`.
   * Can be called from any thread.
   */
  bool visit(
      SurfaceId surfaceId,
      std::function<void(const ShadowTree &shadowTree)> const &callback) const;

  /*
   * Enumerates all stored shadow trees.
   * Can be called from any thread.
   */
  void enumerate(
      std::function<void(const ShadowTree &shadowTree)> const &callback) const;

 private:
  mutable butter::shared_mutex mutex_;
  mutable butter::map<SurfaceId, std::unique_ptr<ShadowTree>>
      registry_; // Protected by `mutex_`.
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
