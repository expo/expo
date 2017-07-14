/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <memory>

#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#include <JavaScriptCore/JavaScriptCore.h>
#include <cxxReactABI19_0_0/ABI19_0_0JSCExecutor.h>
#include <folly/dynamic.h>
#include <ABI19_0_0jschelpers/ABI19_0_0JavaScriptCore.h>

@class ABI19_0_0RCTBridge;
@class ABI19_0_0RCTModuleData;

@interface ABI19_0_0RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;

@end

namespace facebook {
namespace ReactABI19_0_0 {

class Instance;

std::vector<std::unique_ptr<NativeModule>> createNativeModules(NSArray<ABI19_0_0RCTModuleData *> *modules, ABI19_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef);

/*
 * The ValueEncoder<NSArray *>::toValue is used by JSCExecutor callFunctionSync.
 * Note: Because the NSArray * is really a NSArray * __strong the toValue is
 * accepting NSArray *const __strong instead of NSArray *&&.
 */
template <>
struct ValueEncoder<NSArray *> {
  static Value toValue(JSGlobalContextRef ctx, NSArray *const __strong array)
  {
    JSValue *value = [JSC_JSValue(ctx) valueWithObject:array inContext:contextForGlobalContextRef(ctx)];
    return {ctx, [value JSValueRef]};
  }
};

NSError *tryAndReturnError(const std::function<void()>& func);

} }
