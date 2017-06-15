// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxReactABI18_0_0/ABI18_0_0Executor.h>
#include <cxxReactABI18_0_0/ABI18_0_0MessageQueueThread.h>
#include <ABI18_0_0jschelpers/ABI18_0_0JavaScriptCore.h>

namespace facebook {
namespace ReactABI18_0_0 {

namespace ReactABI18_0_0Marker {
enum ReactABI18_0_0MarkerId {
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
};
using LogMarker = std::function<void(const ReactABI18_0_0MarkerId)>;
extern LogMarker logMarker;
};

namespace PerfLogging {
using InstallNativeHooks = std::function<void(JSGlobalContextRef)>;
extern InstallNativeHooks installNativeHooks;
};

namespace JSNativeHooks {
  using Hook = JSValueRef (*) (
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  extern Hook loggingHook;
  extern Hook nowHook;
}

} }
