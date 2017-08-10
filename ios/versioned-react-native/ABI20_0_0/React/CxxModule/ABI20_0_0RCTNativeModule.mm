/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTNativeModule.h"

#import <ReactABI20_0_0/ABI20_0_0RCTBridge.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridgeMethod.h>
#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <ReactABI20_0_0/ABI20_0_0RCTCxxUtils.h>
#import <ReactABI20_0_0/ABI20_0_0RCTFollyConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTProfile.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

namespace facebook {
namespace ReactABI20_0_0 {

ABI20_0_0RCTNativeModule::ABI20_0_0RCTNativeModule(ABI20_0_0RCTBridge *bridge, ABI20_0_0RCTModuleData *moduleData)
    : m_bridge(bridge)
    , m_moduleData(moduleData) {}

std::string ABI20_0_0RCTNativeModule::getName() {
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> ABI20_0_0RCTNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;

  for (id<ABI20_0_0RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(
      method.JSMethodName.UTF8String,
      ABI20_0_0RCTFunctionDescriptorFromType(method.functionType)
    );
  }

  return descs;
}

folly::dynamic ABI20_0_0RCTNativeModule::getConstants() {
  ABI20_0_0RCT_PROFILE_BEGIN_EVENT(ABI20_0_0RCTProfileTagAlways,
    @"[ABI20_0_0RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = [ABI20_0_0RCTConvert folly_dynamic:constants];
  ABI20_0_0RCT_PROFILE_END_EVENT(ABI20_0_0RCTProfileTagAlways, @"");
  return ret;
}

void ABI20_0_0RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params, int callId) {
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [this, methodId, params=std::move(params), callId] {
    #ifdef WITH_FBSYSTRACE
    if (callId != -1) {
      fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
    }
    #endif
    invokeInner(methodId, std::move(params));
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;
  if (queue == ABI20_0_0RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

MethodCallResult ABI20_0_0RCTNativeModule::callSerializableNativeHook(unsigned int ReactABI20_0_0MethodId, folly::dynamic &&params) {
  return invokeInner(ReactABI20_0_0MethodId, std::move(params));
}

MethodCallResult ABI20_0_0RCTNativeModule::invokeInner(unsigned int methodId, const folly::dynamic &&params) {
  if (!m_bridge.valid) {
    return folly::none;
  }

  id<ABI20_0_0RCTBridgeMethod> method = m_moduleData.methods[methodId];
  if (ABI20_0_0RCT_DEBUG && !method) {
    ABI20_0_0RCTLogError(@"Unknown methodID: %ud for module: %@",
                methodId, m_moduleData.name);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);
  @try {
    id result = [method invokeWithBridge:m_bridge module:m_moduleData.instance arguments:objcParams];
    return convertIdToFollyDynamic(result);
  }
  @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name hasPrefix:ABI20_0_0RCTFatalExceptionName]) {
      @throw exception;
    }

    NSString *message = [NSString stringWithFormat:
                         @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                         exception, method.JSMethodName, m_moduleData.name, objcParams];
    ABI20_0_0RCTFatal(ABI20_0_0RCTErrorWithMessage(message));
  }
}

}
}
