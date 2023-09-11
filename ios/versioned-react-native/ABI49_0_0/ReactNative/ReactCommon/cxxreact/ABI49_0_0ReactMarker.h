/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __APPLE__
#include <functional>
#endif

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {
namespace ABI49_0_0ReactMarker {

enum ABI49_0_0ReactMarkerId {
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
  NATIVE_MODULE_SETUP_START,
  NATIVE_MODULE_SETUP_STOP,
  REGISTER_JS_SEGMENT_START,
  REGISTER_JS_SEGMENT_STOP,
  ABI49_0_0REACT_INSTANCE_INIT_START,
  ABI49_0_0REACT_INSTANCE_INIT_STOP
};

#ifdef __APPLE__
using LogTaggedMarker =
    std::function<void(const ABI49_0_0ReactMarkerId, const char *tag)>; // Bridge only
using LogTaggedMarkerBridgeless =
    std::function<void(const ABI49_0_0ReactMarkerId, const char *tag)>;
using GetAppStartTime = std::function<double()>;
#else
typedef void (
    *LogTaggedMarker)(const ABI49_0_0ReactMarkerId, const char *tag); // Bridge only
typedef void (*LogTaggedMarkerBridgeless)(const ABI49_0_0ReactMarkerId, const char *tag);
typedef double (*GetAppStartTime)();
#endif

#ifndef ABI49_0_0RN_EXPORT
#define ABI49_0_0RN_EXPORT __attribute__((visibility("default")))
#endif

extern ABI49_0_0RN_EXPORT LogTaggedMarker logTaggedMarkerImpl; // Bridge only
extern ABI49_0_0RN_EXPORT LogTaggedMarker logTaggedMarkerBridgelessImpl;
extern ABI49_0_0RN_EXPORT GetAppStartTime getAppStartTimeImpl;

extern ABI49_0_0RN_EXPORT void logMarker(const ABI49_0_0ReactMarkerId markerId); // Bridge only
extern ABI49_0_0RN_EXPORT void logTaggedMarker(
    const ABI49_0_0ReactMarkerId markerId,
    const char *tag); // Bridge only
extern ABI49_0_0RN_EXPORT void logMarkerBridgeless(const ABI49_0_0ReactMarkerId markerId);
extern ABI49_0_0RN_EXPORT void logTaggedMarkerBridgeless(
    const ABI49_0_0ReactMarkerId markerId,
    const char *tag);
extern ABI49_0_0RN_EXPORT double getAppStartTime();

struct ABI49_0_0ReactMarkerEvent {
  const ABI49_0_0ReactMarkerId markerId;
  const char *tag;
  double time;
};

class StartupLogger {
 public:
  static StartupLogger &getInstance();

  void logStartupEvent(const ABI49_0_0ReactMarker::ABI49_0_0ReactMarkerId markerId);
  double getAppStartTime();
  double getRunJSBundleStartTime();
  double getRunJSBundleEndTime();

 private:
  StartupLogger() = default;
  StartupLogger(const StartupLogger &) = delete;
  StartupLogger &operator=(const StartupLogger &) = delete;

  double runJSBundleStartTime;
  double runJSBundleEndTime;
};

} // namespace ABI49_0_0ReactMarker
} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
