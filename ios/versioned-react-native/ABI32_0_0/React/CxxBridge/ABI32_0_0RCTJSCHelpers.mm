/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI32_0_0RCTJSCHelpers.h"

#import <Foundation/Foundation.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridge+Private.h>
#import <ReactABI32_0_0/ABI32_0_0RCTCxxUtils.h>
#import <ReactABI32_0_0/ABI32_0_0RCTLog.h>
#import <cxxReactABI32_0_0/ABI32_0_0Platform.h>
#import <ABI32_0_0jschelpers/ABI32_0_0Value.h>

using namespace facebook::ReactABI32_0_0;

namespace {

JSValueRef nativeLoggingHook(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  ABI32_0_0RCTLogLevel level = ABI32_0_0RCTLogLevelInfo;
  if (argumentCount > 1) {
    level = MAX(level, (ABI32_0_0RCTLogLevel)Value(ctx, arguments[1]).asNumber());
  }
  if (argumentCount > 0) {
    JSContext *contextObj = contextForGlobalContextRef(JSC_JSContextGetGlobalContext(ctx));
    JSValue *msg = [JSC_JSValue(ctx) valueWithJSValueRef:arguments[0] inContext:contextObj];
    _ABI32_0_0RCTLogJavaScriptInternal(level, [msg toString]);
  }
  return Value::makeUndefined(ctx);
}

JSValueRef nativePerformanceNow(
    JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  return Value::makeNumber(ctx, CACurrentMediaTime() * 1000);
}

}

void ABI32_0_0RCTPrepareJSCExecutor() {
  ReactABI32_0_0Marker::logTaggedMarker = [](const ReactABI32_0_0Marker::ReactABI32_0_0MarkerId, const char *tag) {};
  JSCNativeHooks::loggingHook = nativeLoggingHook;
  JSCNativeHooks::nowHook = nativePerformanceNow;
  JSCNativeHooks::installPerfHooks = ABI32_0_0RCTFBQuickPerformanceLoggerConfigureHooks;
}
