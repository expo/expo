/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ReactMarker.h"
#include <ABI49_0_0cxxreact/ABI49_0_0JSExecutor.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {
namespace ABI49_0_0ReactMarker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarkerImpl = nullptr;
LogTaggedMarker logTaggedMarkerBridgelessImpl = nullptr;
GetAppStartTime getAppStartTimeImpl = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ABI49_0_0ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

void logTaggedMarker(const ABI49_0_0ReactMarkerId markerId, const char *tag) {
  StartupLogger::getInstance().logStartupEvent(markerId);
  logTaggedMarkerImpl(markerId, tag);
}

void logMarkerBridgeless(const ABI49_0_0ReactMarkerId markerId) {
  logTaggedMarkerBridgeless(markerId, nullptr);
}

void logTaggedMarkerBridgeless(const ABI49_0_0ReactMarkerId markerId, const char *tag) {
  StartupLogger::getInstance().logStartupEvent(markerId);
  logTaggedMarkerBridgelessImpl(markerId, tag);
}

StartupLogger &StartupLogger::getInstance() {
  static StartupLogger instance;
  return instance;
}

void StartupLogger::logStartupEvent(const ABI49_0_0ReactMarkerId markerId) {
  auto now = JSExecutor::performanceNow();
  switch (markerId) {
    case ABI49_0_0ReactMarkerId::RUN_JS_BUNDLE_START:
      if (runJSBundleStartTime == 0) {
        runJSBundleStartTime = now;
      }
      return;

    case ABI49_0_0ReactMarkerId::RUN_JS_BUNDLE_STOP:
      if (runJSBundleEndTime == 0) {
        runJSBundleEndTime = now;
      }
      return;

    default:
      return;
  }
}

double StartupLogger::getAppStartTime() {
  if (getAppStartTimeImpl == nullptr) {
    return 0;
  }

  return getAppStartTimeImpl();
}

double StartupLogger::getRunJSBundleStartTime() {
  return runJSBundleStartTime;
}

double StartupLogger::getRunJSBundleEndTime() {
  return runJSBundleEndTime;
}

} // namespace ABI49_0_0ReactMarker
} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
