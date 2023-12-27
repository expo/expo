/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingTransaction.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/TransactionTelemetry.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
