/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/mounting/MountingTelemetry.h>
#include <ABI42_0_0React/mounting/MountingTransaction.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Contains all (meta)information related to a MountingTransaction except a list
 * of mutation instructions.
 * The class is meant to be used when a consumer should not have access to all
 * information about the transaction (incapsulation) but still needs to observe
 * it to produce some side-effects.
 */
class MountingTransactionMetadata final {
 public:
  SurfaceId surfaceId;
  MountingTransaction::Number number;
  MountingTelemetry telemetry;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
