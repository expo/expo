/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#import <JavaScriptCore/JavaScriptCore.h>

#import <cxxReactABI28_0_0/ABI28_0_0JSCExecutor.h>
#import <ABI28_0_0jschelpers/ABI28_0_0JavaScriptCore.h>

@class ABI28_0_0RCTBridge;
@class ABI28_0_0RCTModuleData;

namespace facebook {
namespace ReactABI28_0_0 {

class Instance;

std::vector<std::unique_ptr<NativeModule>> createNativeModules(NSArray<ABI28_0_0RCTModuleData *> *modules, ABI28_0_0RCTBridge *bridge, const std::shared_ptr<Instance> &instance);

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef);

template<>
struct JSCValueEncoder<id> {
  static Value toJSCValue(JSGlobalContextRef ctx, id obj) {
    JSValue *value = [JSC_JSValue(ctx) valueWithObject:obj inContext:contextForGlobalContextRef(ctx)];
    return {ctx, [value JSValueRef]};
  }
};

NSError *tryAndReturnError(const std::function<void()>& func);
NSString *deriveSourceURL(NSURL *url);

} }
