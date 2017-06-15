// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI18_0_0RCTJSCHelpers.h"

#import <Foundation/Foundation.h>

#import <ReactABI18_0_0/ABI18_0_0RCTBridge+Private.h>
#import <ReactABI18_0_0/ABI18_0_0RCTLog.h>
#import <cxxReactABI18_0_0/ABI18_0_0Platform.h>
#import <ABI18_0_0jschelpers/ABI18_0_0Value.h>

using namespace facebook::ReactABI18_0_0;

namespace {

JSValueRef nativeLoggingHook(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  ABI18_0_0RCTLogLevel level = ABI18_0_0RCTLogLevelInfo;
  if (argumentCount > 1) {
    level = MAX(level, (ABI18_0_0RCTLogLevel)Value(ctx, arguments[1]).asNumber());
  }
  if (argumentCount > 0) {
    String message = Value(ctx, arguments[0]).toString();
    _ABI18_0_0RCTLogJavaScriptInternal(level, @(message.str().c_str()));
  }
  return Value::makeUndefined(ctx);
}

JSValueRef nativePerformanceNow(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  return Value::makeNumber(ctx, CACurrentMediaTime() * 1000);
}

}

void ABI18_0_0RCTPrepareJSCExecutor() {
  ReactABI18_0_0Marker::logMarker = [](const ReactABI18_0_0Marker::ReactABI18_0_0MarkerId) {};
  PerfLogging::installNativeHooks = ABI18_0_0RCTFBQuickPerformanceLoggerConfigureHooks;
  JSNativeHooks::loggingHook = nativeLoggingHook;
  JSNativeHooks::nowHook = nativePerformanceNow;
}
