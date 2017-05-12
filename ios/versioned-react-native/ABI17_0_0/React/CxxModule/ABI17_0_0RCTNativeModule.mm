/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTNativeModule.h"

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTBridgeMethod.h>
#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>
#import <ReactABI17_0_0/ABI17_0_0RCTCxxUtils.h>
#import <ReactABI17_0_0/ABI17_0_0RCTFollyConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTProfile.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

namespace facebook {
namespace ReactABI17_0_0 {

ABI17_0_0RCTNativeModule::ABI17_0_0RCTNativeModule(ABI17_0_0RCTBridge *bridge, ABI17_0_0RCTModuleData *moduleData)
    : m_bridge(bridge)
    , m_moduleData(moduleData) {}

std::string ABI17_0_0RCTNativeModule::getName() {
  return [m_moduleData.name UTF8String];
}

std::vector<MethodDescriptor> ABI17_0_0RCTNativeModule::getMethods() {
  std::vector<MethodDescriptor> descs;

  for (id<ABI17_0_0RCTBridgeMethod> method in m_moduleData.methods) {
    descs.emplace_back(
      method.JSMethodName.UTF8String,
      method.functionType == ABI17_0_0RCTFunctionTypePromise ? "promise" : "async"
    );
  }

  return descs;
}

folly::dynamic ABI17_0_0RCTNativeModule::getConstants() {
  // TODO mhorowitz #10487027: This does unnecessary work since it
  // only needs constants.  Think about refactoring ABI17_0_0RCTModuleData or
  // NativeModule to make this more natural.

  ABI17_0_0RCT_PROFILE_BEGIN_EVENT(ABI17_0_0RCTProfileTagAlways,
                          @"[ABI17_0_0RCTNativeModule getConstants] moduleData.config", nil);
  NSArray *config = m_moduleData.config;
  ABI17_0_0RCT_PROFILE_END_EVENT(ABI17_0_0RCTProfileTagAlways, @"");
  if (!config || config == (id)kCFNull) {
    return nullptr;
  }
  id constants = config[1];
  if (![constants isKindOfClass:[NSDictionary class]]) {
      return nullptr;
  }
  ABI17_0_0RCT_PROFILE_BEGIN_EVENT(ABI17_0_0RCTProfileTagAlways,
                          @"[ABI17_0_0RCTNativeModule getConstants] convert", nil);
  folly::dynamic ret = [ABI17_0_0RCTConvert folly_dynamic:constants];
  ABI17_0_0RCT_PROFILE_END_EVENT(ABI17_0_0RCTProfileTagAlways, @"");
  return ret;
}

bool ABI17_0_0RCTNativeModule::supportsWebWorkers() {
  return false;
}

void ABI17_0_0RCTNativeModule::invoke(ExecutorToken token, unsigned int methodId, folly::dynamic &&params) {
  // The BatchedBridge version of this buckets all the callbacks by thread, and
  // queues one block on each.  This is much simpler; we'll see how it goes and
  // iterate.

  // There is no flow event handling here until I can understand it.

  auto sparams = std::make_shared<folly::dynamic>(std::move(params));

  __weak ABI17_0_0RCTBridge *bridge = m_bridge;

  dispatch_block_t block = ^{
    if (!bridge || !bridge.valid) {
      return;
    }

    id<ABI17_0_0RCTBridgeMethod> method = m_moduleData.methods[methodId];
    if (ABI17_0_0RCT_DEBUG && !method) {
      ABI17_0_0RCTLogError(@"Unknown methodID: %ud for module: %@",
                  methodId, m_moduleData.name);
    }

    NSArray *objcParams = convertFollyDynamicToId(*sparams);

    @try {
      [method invokeWithBridge:bridge module:m_moduleData.instance arguments:objcParams];
    }
    @catch (NSException *exception) {
      // Pass on JS exceptions
      if ([exception.name hasPrefix:ABI17_0_0RCTFatalExceptionName]) {
        @throw exception;
      }

      NSString *message = [NSString stringWithFormat:
                           @"Exception '%@' was thrown while invoking %@ on target %@ with params %@",
                           exception, method.JSMethodName, m_moduleData.name, objcParams];
      ABI17_0_0RCTFatal(ABI17_0_0RCTErrorWithMessage(message));
    }
  };

  dispatch_queue_t queue = m_moduleData.methodQueue;

  if (queue == ABI17_0_0RCTJSThread) {
    block();
  } else if (queue) {
    dispatch_async(queue, block);
  }
}

MethodCallResult ABI17_0_0RCTNativeModule::callSerializableNativeHook(
    ExecutorToken token, unsigned int ReactABI17_0_0MethodId, folly::dynamic &&params) {
  ABI17_0_0RCTFatal(ABI17_0_0RCTErrorWithMessage(@"callSerializableNativeHook is not yet supported on iOS"));
  return folly::none;
}


}
}
