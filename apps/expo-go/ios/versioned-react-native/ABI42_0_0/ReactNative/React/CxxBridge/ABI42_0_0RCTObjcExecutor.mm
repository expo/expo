/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTObjcExecutor.h"

#import <ABI42_0_0React/ABI42_0_0RCTCxxUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTFollyConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTJavaScriptExecutor.h>
#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTProfile.h>
#import <ABI42_0_0React/ABI42_0_0RCTUtils.h>
#import <ABI42_0_0cxxreact/ABI42_0_0JSBigString.h>
#import <ABI42_0_0cxxreact/ABI42_0_0JSExecutor.h>
#import <ABI42_0_0cxxreact/ABI42_0_0MessageQueueThread.h>
#import <ABI42_0_0cxxreact/ABI42_0_0ModuleRegistry.h>
#import <ABI42_0_0cxxreact/ABI42_0_0RAMBundleRegistry.h>
#import <folly/json.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

namespace {

class JSEException : public std::runtime_error {
 public:
  JSEException(NSError *error) : runtime_error([[error description] UTF8String]) {}
};

class ABI42_0_0RCTObjcExecutor : public JSExecutor {
 public:
  ABI42_0_0RCTObjcExecutor(
      id<ABI42_0_0RCTJavaScriptExecutor> jse,
      ABI42_0_0RCTJavaScriptCompleteBlock errorBlock,
      std::shared_ptr<MessageQueueThread> jsThread,
      std::shared_ptr<ExecutorDelegate> delegate)
      : m_jse(jse), m_errorBlock(errorBlock), m_delegate(std::move(delegate)), m_jsThread(std::move(jsThread))
  {
    m_jsCallback = ^(id json, NSError *error) {
      if (error) {
        // Do not use "m_errorBlock" here as the bridge might be in the middle
        // of invalidation as a result of error handling and "this" can be
        // already deallocated.
        errorBlock(error);
        return;
      }

      m_jsThread->runOnQueue(
          [this, json] { m_delegate->callNativeModules(*this, convertIdToFollyDynamic(json), true); });
    };

    // Synchronously initialize the executor
    [jse setUp];

    folly::dynamic nativeModuleConfig = folly::dynamic::array;
    auto moduleRegistry = m_delegate->getModuleRegistry();
    for (const auto &name : moduleRegistry->moduleNames()) {
      auto config = moduleRegistry->getConfig(name);
      nativeModuleConfig.push_back(config ? config->config : nullptr);
    }

    folly::dynamic config = folly::dynamic::object("remoteModuleConfig", std::move(nativeModuleConfig));

    setGlobalVariable("__fbBatchedBridgeConfig", std::make_unique<JSBigStdString>(folly::toJson(config)));
  }

  void initializeRuntime() override
  {
    // We do nothing here since initialization is done in the constructor
  }

  void loadBundle(std::unique_ptr<const JSBigString> script, std::string sourceURL) override
  {
    ABI42_0_0RCTProfileBeginFlowEvent();
    [m_jse executeApplicationScript:[NSData dataWithBytes:script->c_str() length:script->size()]
                          sourceURL:[[NSURL alloc] initWithString:@(sourceURL.c_str())]
                         onComplete:^(NSError *error) {
                           ABI42_0_0RCTProfileEndFlowEvent();

                           if (error) {
                             m_errorBlock(error);
                             return;
                           }

                           [m_jse flushedQueue:m_jsCallback];
                         }];
  }

  void setBundleRegistry(std::unique_ptr<RAMBundleRegistry>) override
  {
    ABI42_0_0RCTAssert(NO, @"RAM bundles are not supported in ABI42_0_0RCTObjcExecutor");
  }

  void registerBundle(uint32_t __unused bundleId, const std::string __unused &bundlePath) override
  {
    ABI42_0_0RCTAssert(NO, @"RAM bundles are not supported in ABI42_0_0RCTObjcExecutor");
  }

  void callFunction(const std::string &module, const std::string &method, const folly::dynamic &arguments) override
  {
    [m_jse callFunctionOnModule:@(module.c_str())
                         method:@(method.c_str())
                      arguments:convertFollyDynamicToId(arguments)
                       callback:m_jsCallback];
  }

  void invokeCallback(double callbackId, const folly::dynamic &arguments) override
  {
    [m_jse invokeCallbackID:@(callbackId) arguments:convertFollyDynamicToId(arguments) callback:m_jsCallback];
  }

  virtual void setGlobalVariable(std::string propName, std::unique_ptr<const JSBigString> jsonValue) override
  {
    [m_jse injectJSONText:@(jsonValue->c_str()) asGlobalObjectNamed:@(propName.c_str()) callback:m_errorBlock];
  }

  virtual std::string getDescription() override
  {
    return [NSStringFromClass([m_jse class]) UTF8String];
  }

 private:
  id<ABI42_0_0RCTJavaScriptExecutor> m_jse;
  ABI42_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<MessageQueueThread> m_jsThread;
  ABI42_0_0RCTJavaScriptCallback m_jsCallback;
};

}

ABI42_0_0RCTObjcExecutorFactory::ABI42_0_0RCTObjcExecutorFactory(id<ABI42_0_0RCTJavaScriptExecutor> jse, ABI42_0_0RCTJavaScriptCompleteBlock errorBlock)
    : m_jse(jse), m_errorBlock(errorBlock)
{
}

std::unique_ptr<JSExecutor> ABI42_0_0RCTObjcExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue)
{
  return std::unique_ptr<JSExecutor>(new ABI42_0_0RCTObjcExecutor(m_jse, m_errorBlock, jsQueue, delegate));
}

}
}
