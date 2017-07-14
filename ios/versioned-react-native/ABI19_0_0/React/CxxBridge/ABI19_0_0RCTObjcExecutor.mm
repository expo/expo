/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTObjcExecutor.h"

#import <ReactABI19_0_0/ABI19_0_0RCTCxxUtils.h>
#import <ReactABI19_0_0/ABI19_0_0RCTFollyConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTJavaScriptExecutor.h>
#import <ReactABI19_0_0/ABI19_0_0RCTLog.h>
#import <ReactABI19_0_0/ABI19_0_0RCTProfile.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>
#import <cxxReactABI19_0_0/ABI19_0_0Executor.h>
#import <cxxReactABI19_0_0/ABI19_0_0ModuleRegistry.h>
#import <folly/json.h>

namespace facebook {
namespace ReactABI19_0_0 {

namespace {

class JSEException : public std::runtime_error {
public:
  JSEException(NSError *error)
    : runtime_error([[error description] UTF8String]) {}
};

class ABI19_0_0RCTObjcExecutor : public JSExecutor {
public:
  ABI19_0_0RCTObjcExecutor(id<ABI19_0_0RCTJavaScriptExecutor> jse, ABI19_0_0RCTJavaScriptCompleteBlock errorBlock,
                  std::shared_ptr<facebook::ReactABI19_0_0::ExecutorDelegate> delegate)
    : m_jse(jse)
    , m_errorBlock(errorBlock)
    , m_delegate(delegate)
  {
    m_jsCallback = ^(id json, NSError *error) {
      if (error) {
        m_errorBlock(error);
        return;
      }

      m_delegate->callNativeModules(*this, [ABI19_0_0RCTConvert folly_dynamic:json], true);
    };

    // Synchronously initialize the executor
    [jse setUp];

    folly::dynamic nativeModuleConfig = folly::dynamic::array;
    auto moduleRegistry = delegate->getModuleRegistry();
    for (const auto &name : moduleRegistry->moduleNames()) {
      auto config = moduleRegistry->getConfig(name);
      nativeModuleConfig.push_back(config ? config->config : nullptr);
    }

    folly::dynamic config =
      folly::dynamic::object("remoteModuleConfig", std::move(nativeModuleConfig));

    setGlobalVariable(
      "__fbBatchedBridgeConfig",
      std::make_unique<JSBigStdString>(folly::toJson(config)));
  }

  void loadApplicationScript(
      std::unique_ptr<const JSBigString> script,
      std::string sourceURL) override {
    ABI19_0_0RCTProfileBeginFlowEvent();
    [m_jse executeApplicationScript:[NSData dataWithBytes:script->c_str() length:script->size()]
           sourceURL:[[NSURL alloc]
                         initWithString:@(sourceURL.c_str())]
           onComplete:^(NSError *error) {
        ABI19_0_0RCTProfileEndFlowEvent();

        if (error) {
          m_errorBlock(error);
          return;
        }

        [m_jse flushedQueue:m_jsCallback];
      }];
  }

  void setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle>) override {
    ABI19_0_0RCTLogWarn(@"Unbundle is not supported in ABI19_0_0RCTObjcExecutor");
  }

  void callFunction(const std::string &module, const std::string &method,
                    const folly::dynamic &arguments) override {
    [m_jse callFunctionOnModule:@(module.c_str())
           method:@(method.c_str())
           arguments:convertFollyDynamicToId(arguments)
           callback:m_jsCallback];
  }

  void invokeCallback(double callbackId, const folly::dynamic &arguments) override {
    [m_jse invokeCallbackID:@(callbackId)
           arguments:convertFollyDynamicToId(arguments)
           callback:m_jsCallback];
  }

  virtual void setGlobalVariable(
      std::string propName,
      std::unique_ptr<const JSBigString> jsonValue) override {
    [m_jse injectJSONText:@(jsonValue->c_str())
           asGlobalObjectNamed:@(propName.c_str())
           callback:m_errorBlock];
  }

  virtual bool supportsProfiling() override {
    return false;
  };
  virtual void startProfiler(const std::string &titleString) override {};
  virtual void stopProfiler(const std::string &titleString,
                            const std::string &filename) override {};

private:
  id<ABI19_0_0RCTJavaScriptExecutor> m_jse;
  ABI19_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::shared_ptr<facebook::ReactABI19_0_0::ExecutorDelegate> m_delegate;
  ABI19_0_0RCTJavaScriptCallback m_jsCallback;
};

}

ABI19_0_0RCTObjcExecutorFactory::ABI19_0_0RCTObjcExecutorFactory(
  id<ABI19_0_0RCTJavaScriptExecutor> jse, ABI19_0_0RCTJavaScriptCompleteBlock errorBlock)
  : m_jse(jse)
  , m_errorBlock(errorBlock) {}

std::unique_ptr<JSExecutor> ABI19_0_0RCTObjcExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) {
  return std::unique_ptr<JSExecutor>(
    new ABI19_0_0RCTObjcExecutor(m_jse, m_errorBlock, delegate));
}

}
}
