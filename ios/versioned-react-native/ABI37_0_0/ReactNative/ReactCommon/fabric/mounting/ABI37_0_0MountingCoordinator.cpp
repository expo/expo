/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0MountingCoordinator.h"

#ifdef ABI37_0_0RN_SHADOW_TREE_INTROSPECTION
#include <glog/logging.h>
#endif

#include <ABI37_0_0React/mounting/Differentiator.h>
#include <ABI37_0_0React/mounting/ShadowViewMutation.h>
#include <ABI37_0_0React/utils/TimeUtils.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

MountingCoordinator::MountingCoordinator(ShadowTreeRevision baseRevision)
    : surfaceId_(baseRevision.getRootShadowNode().getSurfaceId()),
      baseRevision_(baseRevision) {
#ifdef ABI37_0_0RN_SHADOW_TREE_INTROSPECTION
  stubViewTree_ = stubViewTreeFromShadowNode(baseRevision_.getRootShadowNode());
#endif
}

SurfaceId MountingCoordinator::getSurfaceId() const {
  return surfaceId_;
}

void MountingCoordinator::push(ShadowTreeRevision &&revision) const {
  std::lock_guard<std::mutex> lock(mutex_);

  assert(revision.getNumber() > baseRevision_.getNumber());
  assert(
      !lastRevision_.has_value() ||
      revision.getNumber() != lastRevision_->getNumber());

  if (!lastRevision_.has_value() ||
      lastRevision_->getNumber() < revision.getNumber()) {
    lastRevision_ = std::move(revision);
  }
}

better::optional<MountingTransaction> MountingCoordinator::pullTransaction()
    const {
  std::lock_guard<std::mutex> lock(mutex_);

  if (!lastRevision_.has_value()) {
    return {};
  }

  number_++;

  auto telemetry = lastRevision_->getTelemetry();
  telemetry.willDiff();

  auto mutations = calculateShadowViewMutations(
      baseRevision_.getRootShadowNode(), lastRevision_->getRootShadowNode());

  telemetry.didDiff();

#ifdef ABI37_0_0RN_SHADOW_TREE_INTROSPECTION
  stubViewTree_.mutate(mutations);
  auto stubViewTree =
      stubViewTreeFromShadowNode(lastRevision_->getRootShadowNode());
  if (stubViewTree_ != stubViewTree) {
    LOG(ERROR) << "Old tree:"
               << "\n"
               << baseRevision_.getRootShadowNode().getDebugDescription()
               << "\n";
    LOG(ERROR) << "New tree:"
               << "\n"
               << lastRevision_->getRootShadowNode().getDebugDescription()
               << "\n";
    LOG(ERROR) << "Mutations:"
               << "\n"
               << getDebugDescription(mutations);
    assert(false);
  }
#endif

  baseRevision_ = std::move(*lastRevision_);
  lastRevision_.reset();

  return MountingTransaction{
      surfaceId_, number_, std::move(mutations), telemetry};
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
