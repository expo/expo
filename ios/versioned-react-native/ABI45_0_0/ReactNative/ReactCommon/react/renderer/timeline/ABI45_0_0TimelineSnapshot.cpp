/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0TimelineSnapshot.h"

#include <ABI45_0_0React/ABI45_0_0utils/Telemetry.h>

#include <utility>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

TimelineSnapshot::TimelineSnapshot(
    RootShadowNode::Shared rootShadowNode,
    int index) noexcept
    : rootShadowNode_(std::move(rootShadowNode)),
      frame_(TimelineFrame{index, telemetryTimePointNow()}) {}

RootShadowNode::Shared TimelineSnapshot::getRootShadowNode() const noexcept {
  return rootShadowNode_;
}

TimelineFrame TimelineSnapshot::getFrame() const noexcept {
  return frame_;
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
