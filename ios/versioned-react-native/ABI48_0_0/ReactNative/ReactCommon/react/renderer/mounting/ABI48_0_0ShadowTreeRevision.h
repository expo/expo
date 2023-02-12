/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/root/RootShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingOverrideDelegate.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingTransaction.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/ShadowViewMutation.h>
#include <ABI48_0_0React/ABI48_0_0renderer/telemetry/TransactionTelemetry.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Represent a particular committed state of a shadow tree. The object contains
 * a pointer to a root shadow node, a sequential number of commit and telemetry.
 */
class ShadowTreeRevision final {
 public:
  /*
   * Sequential number of the commit that created this revision of a shadow
   * tree.
   */
  using Number = int64_t;

  friend class ShadowTree;
  friend class MountingCoordinator;

  RootShadowNode::Shared rootShadowNode;
  Number number;
  TransactionTelemetry telemetry;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
