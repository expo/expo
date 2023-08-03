/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootShadowNode.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingOverrideDelegate.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingTransaction.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>
#include <ABI49_0_0React/renderer/telemetry/ABI49_0_0TransactionTelemetry.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
