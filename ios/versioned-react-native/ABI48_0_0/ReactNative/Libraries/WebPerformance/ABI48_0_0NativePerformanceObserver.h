/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0FBReactNativeSpec/ABI48_0_0FBReactNativeSpecJSI.h>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace ABI48_0_0facebook::ABI48_0_0React {

#pragma mark - Structs

using RawPerformanceEntry = NativePerformanceObserverCxxBaseRawPerformanceEntry<
    std::string,
    int32_t,
    double,
    double,
    // For "event" entries only:
    std::optional<double>,
    std::optional<double>,
    std::optional<double>>;

template <>
struct Bridging<RawPerformanceEntry>
    : NativePerformanceObserverCxxBaseRawPerformanceEntryBridging<
          std::string,
          int32_t,
          double,
          double,
          std::optional<double>,
          std::optional<double>,
          std::optional<double>> {};

#pragma mark - implementation

class NativePerformanceObserver
    : public ABI48_0_0NativePerformanceObserverCxxSpec<NativePerformanceObserver>,
      std::enable_shared_from_this<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);

  void startReporting(jsi::Runtime &rt, std::string entryType);

  void stopReporting(jsi::Runtime &rt, std::string entryType);

  std::vector<RawPerformanceEntry> getPendingEntries(jsi::Runtime &rt);

  void setOnPerformanceEntryCallback(
      jsi::Runtime &rt,
      std::optional<AsyncCallback<>> callback);

 private:
  std::optional<AsyncCallback<>> callback_;
};

} // namespace ABI48_0_0facebook::ABI48_0_0React
