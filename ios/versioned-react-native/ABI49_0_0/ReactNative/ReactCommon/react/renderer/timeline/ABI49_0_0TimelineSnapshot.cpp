/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0TimelineSnapshot.h"

#include <ABI49_0_0React/utils/ABI49_0_0Telemetry.h>

#include <utility>

namespace ABI49_0_0facebook::ABI49_0_0React {

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

} // namespace ABI49_0_0facebook::ABI49_0_0React
