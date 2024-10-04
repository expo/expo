/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0NativePerformanceObserver.h"
#include <glog/logging.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

NativePerformanceObserver::NativePerformanceObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : ABI48_0_0NativePerformanceObserverCxxSpec(std::move(jsInvoker)) {}

void NativePerformanceObserver::startReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  LOG(INFO) << "Started reporting perf entry type: " << entryType;
}

void NativePerformanceObserver::stopReporting(
    jsi::Runtime &rt,
    std::string entryType) {
  LOG(INFO) << "Stopped reporting perf entry type: " << entryType;
}

std::vector<RawPerformanceEntry> NativePerformanceObserver::getPendingEntries(
    jsi::Runtime &rt) {
  return std::vector<RawPerformanceEntry>{};
}

void NativePerformanceObserver::setOnPerformanceEntryCallback(
    jsi::Runtime &rt,
    std::optional<AsyncCallback<>> callback) {
  callback_ = callback;
  LOG(INFO) << "setOnPerformanceEntryCallback: "
            << (callback ? "non-empty" : "empty");
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
