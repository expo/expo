// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxReactABI30_0_0/ABI30_0_0JSExecutor.h>
#include <cxxReactABI30_0_0/ABI30_0_0MessageQueueThread.h>
#include <ABI30_0_0jschelpers/ABI30_0_0JavaScriptCore.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace ReactABI30_0_0 {

namespace ReactABI30_0_0Marker {

enum ReactABI30_0_0MarkerId {
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
  NATIVE_MODULE_SETUP_START,
  NATIVE_MODULE_SETUP_STOP,
};

#ifdef __APPLE__
using LogTaggedMarker = std::function<void(const ReactABI30_0_0MarkerId, const char* tag)>;
#else
typedef void(*LogTaggedMarker)(const ReactABI30_0_0MarkerId, const char* tag);
#endif
extern RN_EXPORT LogTaggedMarker logTaggedMarker;

extern void logMarker(const ReactABI30_0_0MarkerId markerId);

}

namespace JSCNativeHooks {

using Hook = JSValueRef(*)(
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception);
extern RN_EXPORT Hook loggingHook;
extern RN_EXPORT Hook nowHook;

typedef void(*ConfigurationHook)(JSGlobalContextRef);
extern RN_EXPORT ConfigurationHook installPerfHooks;

}

} }
