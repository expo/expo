// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#include <ReactABI34_0_0/core/ShadowNode.h>
#include <ReactABI34_0_0/mounting/ShadowViewMutation.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Abstract class for Scheduler's delegate.
 */
class SchedulerDelegate {
 public:
  /*
   * Called right after Scheduler computed (and laid out) a new updated version
   * of the tree and calculated a set of mutations which are suffisient
   * to construct a new one.
   */
  virtual void schedulerDidFinishTransaction(
      Tag rootTag,
      const ShadowViewMutationList &mutations,
      const long commitStartTime,
      const long layoutTime) = 0;

  /*
   * Called right after a new ShadowNode was created.
   */
  virtual void schedulerDidRequestPreliminaryViewAllocation(
      SurfaceId surfaceId,
      ComponentName componentName,
      bool isLayoutable,
      ComponentHandle componentHandle) = 0;

  virtual ~SchedulerDelegate() noexcept = default;
};

} // namespace ReactABI34_0_0
} // namespace facebook
