/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <ABI49_0_0cxxreact/ABI49_0_0ReactMarker.h>
#include <ABI49_0_0jsi/ABI49_0_0instrumentation.h>
#include "ABI49_0_0NativePerformance.h"
#include "ABI49_0_0PerformanceEntryReporter.h"

#include "ABI49_0_0Plugins.h"

std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule> NativePerformanceModuleProvider(
    std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> jsInvoker) {
  return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativePerformance>(
      std::move(jsInvoker));
}

namespace ABI49_0_0facebook::ABI49_0_0React {

NativePerformance::NativePerformance(std::shared_ptr<CallInvoker> jsInvoker)
    : ABI49_0_0NativePerformanceCxxSpec(std::move(jsInvoker)) {}

void NativePerformance::mark(
    jsi::Runtime &rt,
    std::string name,
    double startTime,
    double duration) {
  PerformanceEntryReporter::getInstance().mark(name, startTime, duration);
}

void NativePerformance::measure(
    jsi::Runtime &rt,
    std::string name,
    double startTime,
    double endTime,
    std::optional<double> duration,
    std::optional<std::string> startMark,
    std::optional<std::string> endMark) {
  PerformanceEntryReporter::getInstance().measure(
      name, startTime, endTime, duration, startMark, endMark);
}

std::unordered_map<std::string, double> NativePerformance::getSimpleMemoryInfo(
    jsi::Runtime &rt) {
  auto heapInfo = rt.instrumentation().getHeapInfo(false);
  std::unordered_map<std::string, double> heapInfoToJs;
  for (auto &entry : heapInfo) {
    heapInfoToJs[entry.first] = static_cast<double>(entry.second);
  }
  return heapInfoToJs;
}

ABI49_0_0ReactNativeStartupTiming NativePerformance::getABI49_0_0ReactNativeStartupTiming(
    jsi::Runtime &rt) {
  ABI49_0_0ReactNativeStartupTiming result = {0, 0, 0, 0};

  ABI49_0_0ReactMarker::StartupLogger &startupLogger =
      ABI49_0_0ReactMarker::StartupLogger::getInstance();
  result.startTime = startupLogger.getAppStartTime();
  result.executeJavaScriptBundleEntryPointStart =
      startupLogger.getRunJSBundleStartTime();
  result.executeJavaScriptBundleEntryPointEnd =
      startupLogger.getRunJSBundleEndTime();
  result.endTime = startupLogger.getRunJSBundleEndTime();

  return result;
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
