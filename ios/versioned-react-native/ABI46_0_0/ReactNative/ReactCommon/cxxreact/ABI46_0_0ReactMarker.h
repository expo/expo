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

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {
namespace ABI46_0_0ReactMarker {

enum ABI46_0_0ReactMarkerId {
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
  ABI46_0_0REACT_INSTANCE_INIT_START,
  ABI46_0_0REACT_INSTANCE_INIT_STOP
};

#ifdef __APPLE__
using LogTaggedMarker =
    std::function<void(const ABI46_0_0ReactMarkerId, const char *tag)>; // Bridge only
using LogTaggedMarkerBridgeless =
    std::function<void(const ABI46_0_0ReactMarkerId, const char *tag)>;
#else
typedef void (
    *LogTaggedMarker)(const ABI46_0_0ReactMarkerId, const char *tag); // Bridge only
typedef void (*LogTaggedMarkerBridgeless)(const ABI46_0_0ReactMarkerId, const char *tag);
#endif

#ifndef ABI46_0_0RN_EXPORT
#define ABI46_0_0RN_EXPORT __attribute__((visibility("default")))
#endif

extern ABI46_0_0RN_EXPORT LogTaggedMarker logTaggedMarker; // Bridge only
extern ABI46_0_0RN_EXPORT LogTaggedMarker logTaggedMarkerBridgeless;

extern ABI46_0_0RN_EXPORT void logMarker(const ABI46_0_0ReactMarkerId markerId); // Bridge only
extern ABI46_0_0RN_EXPORT void logMarkerBridgeless(const ABI46_0_0ReactMarkerId markerId);

} // namespace ABI46_0_0ReactMarker
} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
