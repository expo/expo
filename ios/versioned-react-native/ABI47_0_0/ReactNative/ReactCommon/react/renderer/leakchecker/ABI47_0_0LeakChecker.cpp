/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0LeakChecker.h"

#include <glog/logging.h>
#include <ABI47_0_0jsi/ABI47_0_0instrumentation.h>

#include <utility>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

LeakChecker::LeakChecker(RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(std::move(runtimeExecutor)) {}

void LeakChecker::uiManagerDidCreateShadowNodeFamily(
    ShadowNodeFamily::Shared const &shadowNodeFamily) const {
  registry_.add(shadowNodeFamily);
}

void LeakChecker::stopSurface(SurfaceId surfaceId) {
  if (previouslyStoppedSurface_ > 0) {
    // Dispatch the check onto JavaScript thread to make sure all other
    // cleanup code has had chance to run.
    runtimeExecutor_([previouslySoppedSurface = previouslyStoppedSurface_,
                      this](jsi::Runtime &runtime) {
      runtime.instrumentation().collectGarbage("LeakChecker");
      // For now check the previous surface because ABI47_0_0React uses double
      // buffering which keeps the surface that was just stopped in
      // memory. This is a documented problem in the last point of
      // https://github.com/facebook/ABI47_0_0React/issues/16087
      checkSurfaceForLeaks(previouslySoppedSurface);
    });
  }

  previouslyStoppedSurface_ = surfaceId;
}

void LeakChecker::checkSurfaceForLeaks(SurfaceId surfaceId) const {
  auto weakFamilies = registry_.weakFamiliesForSurfaceId(surfaceId);
  unsigned int numberOfLeaks = 0;
  for (auto const &weakFamily : weakFamilies) {
    auto strong = weakFamily.lock();
    if (strong) {
      ++numberOfLeaks;
    }
  }
  if (numberOfLeaks > 0) {
    LOG(ERROR) << "[LeakChecker] Surface with id: " << surfaceId
               << " has leaked " << numberOfLeaks << " components out of "
               << weakFamilies.size();
  }
  registry_.removeFamiliesWithSurfaceId(surfaceId);
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
