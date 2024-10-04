/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpecJSI.h>
#include <functional>
#include <optional>
#include <string>
#include <vector>

namespace ABI49_0_0facebook::ABI49_0_0React {
class PerformanceEntryReporter;

#pragma mark - Structs

using RawPerformanceEntry = NativePerformanceObserverCxxBaseRawPerformanceEntry<
    std::string,
    int32_t,
    double,
    double,
    // For "event" entries only:
    std::optional<double>,
    std::optional<double>,
    std::optional<uint32_t>>;

template <>
struct Bridging<RawPerformanceEntry>
    : NativePerformanceObserverCxxBaseRawPerformanceEntryBridging<
          std::string,
          int32_t,
          double,
          double,
          std::optional<double>,
          std::optional<double>,
          std::optional<uint32_t>> {};

using GetPendingEntriesResult =
    NativePerformanceObserverCxxBaseGetPendingEntriesResult<
        std::vector<RawPerformanceEntry>,
        uint32_t>;

template <>
struct Bridging<GetPendingEntriesResult>
    : NativePerformanceObserverCxxBaseGetPendingEntriesResultBridging<
          std::vector<RawPerformanceEntry>,
          uint32_t> {};

#pragma mark - implementation

class NativePerformanceObserver
    : public ABI49_0_0NativePerformanceObserverCxxSpec<NativePerformanceObserver>,
      std::enable_shared_from_this<NativePerformanceObserver> {
 public:
  NativePerformanceObserver(std::shared_ptr<CallInvoker> jsInvoker);
  ~NativePerformanceObserver();

  void startReporting(jsi::Runtime &rt, int32_t entryType);

  void stopReporting(jsi::Runtime &rt, int32_t entryType);

  GetPendingEntriesResult popPendingEntries(jsi::Runtime &rt);

  void setOnPerformanceEntryCallback(
      jsi::Runtime &rt,
      std::optional<AsyncCallback<>> callback);

  void logRawEntry(jsi::Runtime &rt, RawPerformanceEntry entry);

  std::vector<std::pair<std::string, uint32_t>> getEventCounts(
      jsi::Runtime &rt);

  void setDurationThreshold(
      jsi::Runtime &rt,
      int32_t entryType,
      double durationThreshold);

  void clearEntries(
      jsi::Runtime &rt,
      int32_t entryType,
      std::optional<std::string> entryName);

  std::vector<RawPerformanceEntry> getEntries(
      jsi::Runtime &rt,
      std::optional<int32_t> entryType,
      std::optional<std::string> entryName);

 private:
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
