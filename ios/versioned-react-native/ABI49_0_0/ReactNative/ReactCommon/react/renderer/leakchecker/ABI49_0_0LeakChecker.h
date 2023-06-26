/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNodeFamily.h>
#include <ABI49_0_0React/renderer/leakchecker/ABI49_0_0WeakFamilyRegistry.h>
#include <vector>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
