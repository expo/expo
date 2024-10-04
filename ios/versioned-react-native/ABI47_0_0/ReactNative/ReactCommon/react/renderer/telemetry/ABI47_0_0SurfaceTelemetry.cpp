/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0SurfaceTelemetry.h"

#include <algorithm>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

void SurfaceTelemetry::incorporate(
    TransactionTelemetry const &telemetry,
    int numberOfMutations) {
  layoutTime_ += telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime();
  textMeasureTime_ += telemetry.getTextMeasureTime();
  commitTime_ += telemetry.getCommitEndTime() - telemetry.getCommitStartTime();
  diffTime_ += telemetry.getDiffEndTime() - telemetry.getDiffStartTime();
  mountTime_ += telemetry.getMountEndTime() - telemetry.getMountStartTime();

  numberOfTransactions_++;
  numberOfMutations_ += numberOfMutations;
  numberOfTextMeasurements_ += telemetry.getNumberOfTextMeasurements();
  lastRevisionNumber_ = telemetry.getRevisionNumber();

  while (recentTransactionTelemetries_.size() >=
         kMaxNumberOfRecordedCommitTelemetries) {
    recentTransactionTelemetries_.erase(recentTransactionTelemetries_.begin());
  }

  recentTransactionTelemetries_.push_back(telemetry);
}

TelemetryDuration SurfaceTelemetry::getLayoutTime() const {
  return layoutTime_;
}

TelemetryDuration SurfaceTelemetry::getTextMeasureTime() const {
  return textMeasureTime_;
}

TelemetryDuration SurfaceTelemetry::getCommitTime() const {
  return commitTime_;
}

TelemetryDuration SurfaceTelemetry::getDiffTime() const {
  return diffTime_;
}

TelemetryDuration SurfaceTelemetry::getMountTime() const {
  return mountTime_;
}

int SurfaceTelemetry::getNumberOfTransactions() const {
  return numberOfTransactions_;
}

int SurfaceTelemetry::getNumberOfMutations() const {
  return numberOfMutations_;
}

int SurfaceTelemetry::getNumberOfTextMeasurements() const {
  return numberOfTextMeasurements_;
}

int SurfaceTelemetry::getLastRevisionNumber() const {
  return lastRevisionNumber_;
}

std::vector<TransactionTelemetry>
SurfaceTelemetry::getRecentTransactionTelemetries() const {
  auto result = std::vector<TransactionTelemetry>{};
  result.reserve(recentTransactionTelemetries_.size());
  std::copy(
      recentTransactionTelemetries_.begin(),
      recentTransactionTelemetries_.end(),
      std::back_inserter(result));
  return result;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
