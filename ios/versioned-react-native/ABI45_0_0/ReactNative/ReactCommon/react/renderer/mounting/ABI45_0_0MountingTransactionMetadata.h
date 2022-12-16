/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/mounting/MountingTransaction.h>
#include <ABI45_0_0React/ABI45_0_0renderer/telemetry/TransactionTelemetry.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

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
  TransactionTelemetry telemetry;
  SurfaceTelemetry surfaceTelemetry;
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
