/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTNativeModule.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeMethod.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTCxxUtils.h>
#import <ABI41_0_0React/ABI41_0_0RCTFollyConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>
#import <ABI41_0_0React/ABI41_0_0RCTProfile.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

static MethodCallResult
invokeInner(ABI41_0_0RCTBridge *bridge, ABI41_0_0RCTModuleData *moduleData, unsigned int methodId, const folly::dynamic &params);

ABI41_0_0RCTNativeModule::ABI41_0_0RCTNativeModule(ABI41_0_0RCTBridge *bridge, ABI41_0_0RCTModuleData *moduleData)
    : m_bridge(bridge), m_moduleData(moduleData)
{
}

std::string ABI41_0_0RCTNativeModule::getName()
{
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> ABI41_0_0RCTNativeModule::getMethods()
{
  std::vector<MethodDescriptor> descs;

  for (id<ABI41_0_0RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(method.JSMethodName, ABI41_0_0RCTFunctionDescriptorFromType(method.functionType));
  }

  return descs;
}

folly::dynamic ABI41_0_0RCTNativeModule::getConstants()
{
  ABI41_0_0RCT_PROFILE_BEGIN_EVENT(ABI41_0_0RCTProfileTagAlways, @"[ABI41_0_0RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = convertIdToFollyDynamic(constants);
  ABI41_0_0RCT_PROFILE_END_EVENT(ABI41_0_0RCTProfileTagAlways, @"");
  return ret;
}

void ABI41_0_0RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params, int callId)
{
  // capture by weak pointer so that we can safely use these variables in a callback
  __weak ABI41_0_0RCTBridge *weakBridge = m_bridge;
  __weak ABI41_0_0RCTModuleData *weakModuleData = m_moduleData;
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [weakBridge, weakModuleData, methodId, params = std::move(params), callId] {
#ifdef WITH_FBSYSTRACE
    if (callId != -1) {
      fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
    }
#else
    (void)(callId);
#endif
    invokeInner(weakBridge, weakModuleData, methodId, std::move(params));
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;
  if (queue == ABI41_0_0RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }

#ifdef ABI41_0_0RCT_DEV
  if (!queue) {
    ABI41_0_0RCTLog(
        @"Attempted to invoke `%u` (method ID) on `%@` (NativeModule name) without a method queue.",
        methodId,
        m_moduleData.name);
  }
#endif
}

MethodCallResult ABI41_0_0RCTNativeModule::callSerializableNativeHook(unsigned int ABI41_0_0ReactMethodId, folly::dynamic &&params)
{
  return invokeInner(m_bridge, m_moduleData, ABI41_0_0ReactMethodId, params);
}

static MethodCallResult
invokeInner(ABI41_0_0RCTBridge *bridge, ABI41_0_0RCTModuleData *moduleData, unsigned int methodId, const folly::dynamic &params)
{
  if (!bridge || !bridge.valid || !moduleData) {
    return folly::none;
  }

  id<ABI41_0_0RCTBridgeMethod> method = moduleData.methods[methodId];
  if (ABI41_0_0RCT_DEBUG && !method) {
    ABI41_0_0RCTLogError(@"Unknown methodID: %ud for module: %@", methodId, moduleData.name);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);
  @try {
    id result = [method invokeWithBridge:bridge module:moduleData.instance arguments:objcParams];
    return convertIdToFollyDynamic(result);
  } @catch (NSException *exception) {
    // Pass on JS exceptions
    if ([exception.name hasPrefix:ABI41_0_0RCTFatalExceptionName]) {
      @throw exception;
    }

#if ABI41_0_0RCT_DEBUG
    NSString *message = [NSString
        stringWithFormat:@"Exception '%@' was thrown while invoking %s on target %@ with params %@\ncallstack: %@",
                         exception,
                         method.JSMethodName,
                         moduleData.name,
                         objcParams,
                         exception.callStackSymbols];
    ABI41_0_0RCTFatal(ABI41_0_0RCTErrorWithMessage(message));
#else
    ABI41_0_0RCTFatalException(exception);
#endif
  }

  return folly::none;
}

}
}
