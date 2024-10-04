/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0TelemetryController.h"

#include <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingCoordinator.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

TelemetryController::TelemetryController(
    MountingCoordinator const &mountingCoordinator) noexcept
    : mountingCoordinator_(mountingCoordinator) {}

bool TelemetryController::pullTransaction(
    MountingTransactionCallback const &willMount,
    MountingTransactionCallback const &doMount,
    MountingTransactionCallback const &didMount) const {
  auto optional = mountingCoordinator_.pullTransaction();
  if (!optional.has_value()) {
    return false;
  }

  auto transaction = std::move(*optional);

  auto &telemetry = transaction.getTelemetry();
  auto numberOfMutations = static_cast<int>(transaction.getMutations().size());

  mutex_.lock();
  auto compoundTelemetry = compoundTelemetry_;
  mutex_.unlock();

  willMount(transaction, compoundTelemetry);

  telemetry.willMount();
  doMount(transaction, compoundTelemetry);
  telemetry.didMount();

  compoundTelemetry.incorporate(telemetry, numberOfMutations);

  didMount(transaction, compoundTelemetry);

  mutex_.lock();
  compoundTelemetry_ = compoundTelemetry;
  mutex_.unlock();

  return true;
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
