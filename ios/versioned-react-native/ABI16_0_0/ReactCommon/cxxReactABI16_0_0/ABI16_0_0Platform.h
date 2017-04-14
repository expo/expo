// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>
#include <memory>
#include <string>

#include <cxxReactABI16_0_0/ABI16_0_0Executor.h>
#include <cxxReactABI16_0_0/ABI16_0_0MessageQueueThread.h>
#include <ABI16_0_0jschelpers/ABI16_0_0JavaScriptCore.h>

namespace facebook {
namespace ReactABI16_0_0 {

namespace ReactABI16_0_0Marker {
using LogMarker = std::function<void(const std::string&)>;
extern LogMarker logMarker;
};

namespace WebWorkerUtil {
using WebWorkerQueueFactory = std::function<std::unique_ptr<MessageQueueThread>(int id, MessageQueueThread* ownerMessageQueue)>;
extern WebWorkerQueueFactory createWebWorkerThread;

using LoadScriptFromAssets = std::function<std::unique_ptr<const JSBigString>(const std::string& assetName)>;
extern LoadScriptFromAssets loadScriptFromAssets;

using LoadScriptFromNetworkSync = std::function<std::string(const std::string& url, const std::string& tempfileName)>;
extern LoadScriptFromNetworkSync loadScriptFromNetworkSync;
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
