// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI17_0_0RCTJSCHelpers.h"

#import <Foundation/Foundation.h>

#import <ReactABI17_0_0/ABI17_0_0RCTBridge+Private.h>
#import <ReactABI17_0_0/ABI17_0_0RCTLog.h>
#import <cxxReactABI17_0_0/ABI17_0_0Platform.h>
#import <ABI17_0_0jschelpers/ABI17_0_0Value.h>

using namespace facebook::ReactABI17_0_0;

namespace {

JSValueRef nativeLoggingHook(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  ABI17_0_0RCTLogLevel level = ABI17_0_0RCTLogLevelInfo;
  if (argumentCount > 1) {
    level = MAX(level, (ABI17_0_0RCTLogLevel)Value(ctx, arguments[1]).asNumber());
  }
  if (argumentCount > 0) {
    String message = Value(ctx, arguments[0]).toString();
    _ABI17_0_0RCTLogJavaScriptInternal(level, @(message.str().c_str()));
  }
  return Value::makeUndefined(ctx);
}

JSValueRef nativePerformanceNow(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  return Value::makeNumber(ctx, CACurrentMediaTime() * 1000);
}

}

void ABI17_0_0RCTPrepareJSCExecutor() {
  ReactABI17_0_0Marker::logMarker = [](const std::string&) {};
  PerfLogging::installNativeHooks = ABI17_0_0RCTFBQuickPerformanceLoggerConfigureHooks;
  JSNativeHooks::loggingHook = nativeLoggingHook;
  JSNativeHooks::nowHook = nativePerformanceNow;
}
