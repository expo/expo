/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include "ABI49_0_0NativePerformanceObserver.h"
#include "ABI49_0_0PerformanceEntryReporter.h"

#include "ABI49_0_0Plugins.h"

std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>
NativePerformanceObserverModuleProvider(
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> jsInvoker) {
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativePerformanceObserver>(
      std::move(jsInvoker));
}

namespace ABI49_0_0facebook::ABI49_0_0React {

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : ABI49_0_0NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {
  setEventLogger(&PerformanceEntryReporter::getInstance());
}

NativePerformanceObserver::~NativePerformanceObserver() {
  setEventLogger(nullptr);
}

void NativePerformanceObserver::startReporting(
    jsi::Runtime &rt,
    int32_t entryType) {
  PerformanceEntryReporter::getInstance().startReporting(
      static_cast<PerformanceEntryType>(entryType));
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    int32_t entryType) {
  PerformanceEntryReporter::getInstance().stopReporting(
      static_cast<PerformanceEntryType>(entryType));
}

GetPendingEntriesResult NativePerformanceObserver::popPendingEntries(
    jsi::Runtime &rt) {
  return PerformanceEntryReporter::getInstance().popPendingEntries();
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  PerformanceEntryReporter::getInstance().setReportingCallback(callback);
}

void NativePerformanceObserver::logRawEntry(
    jsi::Runtime &rt,
    RawPerformanceEntry entry) {
  PerformanceEntryReporter::getInstance().logEntry(entry);
}

std::vector<std::pair<std::string, uint32_t>>
NativePerformanceObserver::getEventCounts(jsi::Runtime &rt) {
  const auto &eventCounts =
      PerformanceEntryReporter::getInstance().getEventCounts();
  return std::vector<std::pair<std::string, uint32_t>>(
      eventCounts.begin(), eventCounts.end());
}

void NativePerformanceObserver::setDurationThreshold(
    jsi::Runtime &rt,
    int32_t entryType,
    double durationThreshold) {
  PerformanceEntryReporter::getInstance().setDurationThreshold(
      static_cast<PerformanceEntryType>(entryType), durationThreshold);
}

void NativePerformanceObserver::clearEntries(
    jsi::Runtime &rt,
    int32_t entryType,
    std::optional<std::string> entryName) {
  PerformanceEntryReporter::getInstance().clearEntries(
      static_cast<PerformanceEntryType>(entryType),
      entryName ? entryName->c_str() : nullptr);
}

std::vector<RawPerformanceEntry> NativePerformanceObserver::getEntries(
    jsi::Runtime &rt,
    std::optional<int32_t> entryType,
    std::optional<std::string> entryName) {
  return PerformanceEntryReporter::getInstance().getEntries(
      entryType ? static_cast<PerformanceEntryType>(*entryType)
                : PerformanceEntryType::UNDEFINED,
      entryName ? entryName->c_str() : nullptr);
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
