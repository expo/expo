/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTNativeModule.h"

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeMethod.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTCxxUtils.h>
#import <ABI47_0_0React/ABI47_0_0RCTFollyConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import <ABI47_0_0React/ABI47_0_0RCTProfile.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#import <ABI47_0_0Reactperflogger/ABI47_0_0BridgeNativeModulePerfLogger.h>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

namespace {
enum SchedulingContext { Sync, Async };
}

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

static MethodCallResult invokeInner(
    ABI47_0_0RCTBridge *bridge,
    ABI47_0_0RCTModuleData *moduleData,
    unsigned int methodId,
    const folly::dynamic &params,
    int callId,
    SchedulingContext context);

ABI47_0_0RCTNativeModule::ABI47_0_0RCTNativeModule(ABI47_0_0RCTBridge *bridge, ABI47_0_0RCTModuleData *moduleData)
    : m_bridge(bridge), m_moduleData(moduleData)
{
}

std::string ABI47_0_0RCTNativeModule::getName()
{
  return [m_moduleData.name UTF8String];
}

std::string ABI47_0_0RCTNativeModule::getSyncMethodName(unsigned int methodId)
{
  return m_moduleData.methods[methodId].JSMethodName;
}

std::vector<MethodDescriptor> ABI47_0_0RCTNativeModule::getMethods()
{
  std::vector<MethodDescriptor> descs;

  for (id<ABI47_0_0RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(method.JSMethodName, ABI47_0_0RCTFunctionDescriptorFromType(method.functionType));
  }

  return descs;
}

folly::dynamic ABI47_0_0RCTNativeModule::getConstants()
{
  ABI47_0_0RCT_PROFILE_BEGIN_EVENT(ABI47_0_0RCTProfileTagAlways, @"[ABI47_0_0RCTNativeModule getConstants] moduleData.exportedConstants", nil);
  NSDictionary *constants = m_moduleData.exportedConstants;
  folly::dynamic ret = convertIdToFollyDynamic(constants);
  ABI47_0_0RCT_PROFILE_END_EVENT(ABI47_0_0RCTProfileTagAlways, @"");
  return ret;
}

void ABI47_0_0RCTNativeModule::invoke(unsigned int methodId, folly::dynamic &&params, int callId)
{
  const char *moduleName = [m_moduleData.name UTF8String];
  const char *methodName = m_moduleData.methods[methodId].JSMethodName;

  dispatch_queue_t queue = m_moduleData.methodQueue;
  const bool isSyncModule = queue == ABI47_0_0RCTJSThread;

  if (isSyncModule) {
    BridgeNativeModulePerfLogger::syncMethodCallStart(moduleName, methodName);
    BridgeNativeModulePerfLogger::syncMethodCallArgConversionStart(moduleName, methodName);
  } else {
    BridgeNativeModulePerfLogger::asyncMethodCallStart(moduleName, methodName);
  }

  // capture by weak pointer so that we can safely use these variables in a callback
  __weak ABI47_0_0RCTBridge *weakBridge = m_bridge;
  __weak ABI47_0_0RCTModuleData *weakModuleData = m_moduleData;
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.
  dispatch_block_t block = [weakBridge, weakModuleData, methodId, params = std::move(params), callId, isSyncModule] {
#ifdef WITH_FBSYSTRACE
    if (callId != -1) {
      fbsystrace_end_async_flow(TRACE_TAG_REACT_APPS, "native", callId);
    }
#else
    (void)(callId);
#endif
    @autoreleasepool {
      invokeInner(weakBridge, weakModuleData, methodId, std::move(params), callId, isSyncModule ? Sync : Async);
    }
  };

  if (isSyncModule) {
    block();
    BridgeNativeModulePerfLogger::syncMethodCallReturnConversionEnd(moduleName, methodName);
  } else if (queue) {
    BridgeNativeModulePerfLogger::asyncMethodCallDispatch(moduleName, methodName);
    dispatch_async(queue, block);
  }

#ifdef ABI47_0_0RCT_DEV
  if (!queue) {
    ABI47_0_0RCTLog(
        @"Attempted to invoke `%u` (method ID) on `%@` (NativeModule name) without a method queue.",
        methodId,
        m_moduleData.name);
  }
#endif

  if (isSyncModule) {
    BridgeNativeModulePerfLogger::syncMethodCallEnd(moduleName, methodName);
  } else {
    BridgeNativeModulePerfLogger::asyncMethodCallEnd(moduleName, methodName);
  }
}

MethodCallResult ABI47_0_0RCTNativeModule::callSerializableNativeHook(unsigned int ABI47_0_0ReactMethodId, folly::dynamic &&params)
{
  return invokeInner(m_bridge, m_moduleData, ABI47_0_0ReactMethodId, params, 0, Sync);
}

static MethodCallResult invokeInner(
    ABI47_0_0RCTBridge *bridge,
    ABI47_0_0RCTModuleData *moduleData,
    unsigned int methodId,
    const folly::dynamic &params,
    int callId,
    SchedulingContext context)
{
  if (!bridge || !bridge.valid || !moduleData) {
    if (context == Sync) {
      /**
       * NOTE: moduleName and methodName are "". This shouldn't be an issue because there can only be one ongoing sync
       * call at a time, and when we call syncMethodCallFail, that one call should terminate. This is also an
       * exceptional scenario, so it shouldn't occur often.
       */
      BridgeNativeModulePerfLogger::syncMethodCallFail("N/A", "N/A");
    }
    return folly::none;
  }

  id<ABI47_0_0RCTBridgeMethod> method = moduleData.methods[methodId];
  if (ABI47_0_0RCT_DEBUG && !method) {
    ABI47_0_0RCTLogError(@"Unknown methodID: %ud for module: %@", methodId, moduleData.name);
  }

  const char *moduleName = [moduleData.name UTF8String];
  const char *methodName = moduleData.methods[methodId].JSMethodName;

  if (context == Async) {
    BridgeNativeModulePerfLogger::asyncMethodCallExecutionStart(moduleName, methodName, (int32_t)callId);
    BridgeNativeModulePerfLogger::asyncMethodCallExecutionArgConversionStart(moduleName, methodName, (int32_t)callId);
  }

  NSArray *objcParams = convertFollyDynamicToId(params);

  if (context == Sync) {
    BridgeNativeModulePerfLogger::syncMethodCallArgConversionEnd(moduleName, methodName);
  }

  @try {
    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallExecutionStart(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionArgConversionEnd(moduleName, methodName, (int32_t)callId);
    }

    id result = [method invokeWithBridge:bridge module:moduleData.instance arguments:objcParams];

    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallExecutionEnd(moduleName, methodName);
      BridgeNativeModulePerfLogger::syncMethodCallReturnConversionStart(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionEnd(moduleName, methodName, (int32_t)callId);
    }

    return convertIdToFollyDynamic(result);
  } @catch (NSException *exception) {
    if (context == Sync) {
      BridgeNativeModulePerfLogger::syncMethodCallFail(moduleName, methodName);
    } else {
      BridgeNativeModulePerfLogger::asyncMethodCallExecutionFail(moduleName, methodName, (int32_t)callId);
    }

    // Pass on JS exceptions
    if ([exception.name hasPrefix:ABI47_0_0RCTFatalExceptionName]) {
      @throw exception;
    }

#if ABI47_0_0RCT_DEBUG
    NSString *message = [NSString
        stringWithFormat:@"Exception '%@' was thrown while invoking %s on target %@ with params %@\ncallstack: %@",
                         exception,
                         method.JSMethodName,
                         moduleData.name,
                         objcParams,
                         exception.callStackSymbols];
    ABI47_0_0RCTFatal(ABI47_0_0RCTErrorWithMessage(message));
#else
    ABI47_0_0RCTFatalException(exception);
#endif
  }

  return folly::none;
}

}
}
