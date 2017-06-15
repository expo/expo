/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTNativeModule.h"

#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTBridgeMethod.h>
#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>
#import <ReactABI18_0_0/ABI18_0_0RCTCxxUtils.h>
#import <ReactABI18_0_0/ABI18_0_0RCTFollyConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTProfile.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>

namespace facebook {
namespace ReactABI18_0_0 {

ABI18_0_0RCTNativeModule::ABI18_0_0RCTNativeModule(ABI18_0_0RCTBridge *bridge, ABI18_0_0RCTModuleData *moduleData)
    : m_bridge(bridge)
    , m_moduleData(moduleData) {}

std::string ABI18_0_0RCTNativeModule::getName() {
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> ABI18_0_0RCTNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;

  for (id<ABI18_0_0RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(
      method.JSMethodName.UTF8String,
      ABI18_0_0RCTFunctionDescriptorFromType(method.functionType)
    );
  }

  return descs;
}

folly::dynamic ABI18_0_0RCTNativeModule::getConstants() {
  ABI18_0_0RCT_PROFILE_BEGIN_EVENT(ABI18_0_0RCTProfileTagAlways,
    @"[ABI18_0_0RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = [ABI18_0_0RCTConvert folly_dynamic:constants];
  ABI18_0_0RCT_PROFILE_END_EVENT(ABI18_0_0RCTProfileTagAlways, @"");
  return ret;
}

void ABI18_0_0RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params) {
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [this, methodId, params=std::move(params)] {
    if (!m_bridge.valid) {
      return;
    }

    invokeInner(methodId, std::move(params));
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;

  if (queue == ABI18_0_0RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

MethodCallResult ABI18_0_0RCTNativeModule::callSerializableNativeHook(unsigned int ReactABI18_0_0MethodId, folly::dynamic &&params) {
  return invokeInner(ReactABI18_0_0MethodId, std::move(params));
}

MethodCallResult ABI18_0_0RCTNativeModule::invokeInner(unsigned int methodId, const folly::dynamic &&params) {
  id<ABI18_0_0RCTBridgeMethod> method = m_moduleData.methods[methodId];
  if (ABI18_0_0RCT_DEBUG && !method) {
    ABI18_0_0RCTLogError(@"Unknown methodID: %ud for module: %@",
                methodId, m_moduleData.name);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);

  @try {
    id result = [method invokeWithBridge:m_bridge module:m_moduleData.instance arguments:objcParams];
    return convertIdToFollyDynamic(result);
  }
  @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name hasPrefix:ABI18_0_0RCTFatalExceptionName]) {
      @throw exception;
    }

    NSString *message = [NSString stringWithFormat:
                         @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                         exception, method.JSMethodName, m_moduleData.name, objcParams];
    ABI18_0_0RCTFatal(ABI18_0_0RCTErrorWithMessage(message));
  }

}

}
}
