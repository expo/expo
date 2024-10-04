/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>

#include <ABI42_0_0React/mounting/MountingTelemetry.h>
#include <ABI42_0_0React/mounting/MountingTransaction.h>
#include <ABI42_0_0React/mounting/ShadowViewMutation.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

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

  /*
   * Creates the object with given root shadow node, revision number and
   * telemetry.
   */
  ShadowTreeRevision(
      ShadowNode::Shared const &rootShadowNode,
      Number number,
      MountingTelemetry telemetry);

  /*
   * Returns telemetry associated with this revision.
   */
  MountingTelemetry const &getTelemetry() const;

 private:
  friend class MountingCoordinator;

  /*
   * Methods from this section are meant to be used by `MountingCoordinator`
   * only.
   */
  ShadowNode const &getRootShadowNode();
  Number getNumber() const;

 private:
  ShadowNode::Shared rootShadowNode_;
  Number number_;
  MountingTelemetry telemetry_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
