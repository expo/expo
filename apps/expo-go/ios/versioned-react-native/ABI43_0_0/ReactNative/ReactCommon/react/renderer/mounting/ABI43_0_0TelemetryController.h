/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <mutex>

#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingTransaction.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingTransactionMetadata.h>
#include <ABI43_0_0React/ABI43_0_0renderer/mounting/TransactionTelemetry.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class MountingCoordinator;

/*
 * Provides convenient tools for aggregating and accessing telemetry data
 * associated with running Surface.
 */
class TelemetryController final {
  friend class MountingCoordinator;

  /*
   * To be used by `MountingCoordinator`.
   */
  TelemetryController(MountingCoordinator const &mountingCoordinator) noexcept;

  /*
   * Not copyable.
   */
  TelemetryController(TelemetryController const &other) noexcept = delete;
  TelemetryController &operator=(TelemetryController const &other) noexcept =
      delete;

 public:
  /*
   * Calls `MountingCoordinator::pullTransaction()` and aggregates telemetry.
   */
  bool pullTransaction(
      std::function<void(MountingTransactionMetadata metadata)> willMount,
      std::function<void(ShadowViewMutationList const &mutations)> doMount,
      std::function<void(MountingTransactionMetadata metadata)> didMount) const;

 private:
  MountingCoordinator const &mountingCoordinator_;
  mutable SurfaceTelemetry compoundTelemetry_{};
  mutable std::mutex mutex_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
