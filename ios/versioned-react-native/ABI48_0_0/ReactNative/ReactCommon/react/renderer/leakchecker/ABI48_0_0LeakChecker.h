/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNodeFamily.h>
#include <ABI48_0_0React/ABI48_0_0renderer/leakchecker/WeakFamilyRegistry.h>
#include <vector>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

using GarbageCollectionTrigger = std::function<void()>;

class LeakChecker final {
 public:
  LeakChecker(RuntimeExecutor runtimeExecutor);

  void uiManagerDidCreateShadowNodeFamily(
      ShadowNodeFamily::Shared const &shadowNodeFamily) const;
  void stopSurface(SurfaceId surfaceId);

 private:
  void checkSurfaceForLeaks(SurfaceId surfaceId) const;

  RuntimeExecutor const runtimeExecutor_{};

  WeakFamilyRegistry registry_{};
  SurfaceId previouslyStoppedSurface_{};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
