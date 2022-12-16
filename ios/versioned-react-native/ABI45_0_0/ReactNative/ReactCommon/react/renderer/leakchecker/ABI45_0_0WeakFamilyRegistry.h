/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/core/ABI45_0_0ReactPrimitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/ShadowNodeFamily.h>
#include <unordered_map>
#include <vector>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class WeakFamilyRegistry final {
 public:
  using WeakFamilies = std::vector<ShadowNodeFamily::Weak>;

  void add(ShadowNodeFamily::Shared const &shadowNodeFamily) const;
  void removeFamiliesWithSurfaceId(SurfaceId surfaceId) const;
  WeakFamilies weakFamiliesForSurfaceId(SurfaceId surfaceId) const;

 private:
  /**
   * Mutex protecting `families_` property.
   */
  mutable std::mutex familiesMutex_;

  /**
   * A map of ShadowNodeFamily used on surface.
   */
  mutable std::unordered_map<SurfaceId, WeakFamilies> families_{};
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
