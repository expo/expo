/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTObjcExecutor.h"

#import <ReactABI20_0_0/ABI20_0_0RCTCxxUtils.h>
#import <ReactABI20_0_0/ABI20_0_0RCTFollyConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTJavaScriptExecutor.h>
#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTProfile.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUtils.h>
#import <cxxReactABI20_0_0/ABI20_0_0JSBigString.h>
#import <cxxReactABI20_0_0/ABI20_0_0JSExecutor.h>
#import <cxxReactABI20_0_0/ABI20_0_0MessageQueueThread.h>
#import <cxxReactABI20_0_0/ABI20_0_0ModuleRegistry.h>
#import <folly/json.h>

namespace facebook {
namespace ReactABI20_0_0 {

namespace {

class JSEException : public std::runtime_error {
public:
  JSEException(NSError *error)
    : runtime_error([[error description] UTF8String]) {}
};

class ABI20_0_0RCTObjcExecutor : public JSExecutor {
public:
  ABI20_0_0RCTObjcExecutor(id<ABI20_0_0RCTJavaScriptExecutor> jse,
                  ABI20_0_0RCTJavaScriptCompleteBlock errorBlock,
                  std::shared_ptr<MessageQueueThread> jsThread,
                  std::shared_ptr<ExecutorDelegate> delegate)
    : m_jse(jse)
    , m_errorBlock(errorBlock)
    , m_jsThread(std::move(jsThread))
    , m_delegate(std::move(delegate))
  {
    m_jsCallback = ^(id json, NSError *error) {
      if (error) {
        m_errorBlock(error);
        return;
      }

      m_jsThread->runOnQueue([this, json]{
        m_delegate->callNativeModules(*this, [ABI20_0_0RCTConvert folly_dynamic:json], true);
      });
    };

    // Synchronously initialize the executor
    [jse setUp];

    folly::dynamic nativeModuleConfig = folly::dynamic::array;
    auto moduleRegistry = m_delegate->getModuleRegistry();
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
    ABI20_0_0RCTProfileBeginFlowEvent();
    [m_jse executeApplicationScript:[NSData dataWithBytes:script->c_str() length:script->size()]
           sourceURL:[[NSURL alloc]
                         initWithString:@(sourceURL.c_str())]
           onComplete:^(NSError *error) {
        ABI20_0_0RCTProfileEndFlowEvent();

        if (error) {
          m_errorBlock(error);
          return;
        }

        [m_jse flushedQueue:m_jsCallback];
      }];
  }

  void setJSModulesUnbundle(std::unique_ptr<JSModulesUnbundle>) override {
    ABI20_0_0RCTAssert(NO, @"Unbundle is not supported in ABI20_0_0RCTObjcExecutor");
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
  id<ABI20_0_0RCTJavaScriptExecutor> m_jse;
  ABI20_0_0RCTJavaScriptCompleteBlock m_errorBlock;
  std::shared_ptr<ExecutorDelegate> m_delegate;
  std::shared_ptr<MessageQueueThread> m_jsThread;
  ABI20_0_0RCTJavaScriptCallback m_jsCallback;
};

}

ABI20_0_0RCTObjcExecutorFactory::ABI20_0_0RCTObjcExecutorFactory(
  id<ABI20_0_0RCTJavaScriptExecutor> jse, ABI20_0_0RCTJavaScriptCompleteBlock errorBlock)
  : m_jse(jse)
  , m_errorBlock(errorBlock) {}

std::unique_ptr<JSExecutor> ABI20_0_0RCTObjcExecutorFactory::createJSExecutor(
    std::shared_ptr<ExecutorDelegate> delegate,
    std::shared_ptr<MessageQueueThread> jsQueue) {
  return std::unique_ptr<JSExecutor>(
    new ABI20_0_0RCTObjcExecutor(m_jse, m_errorBlock, jsQueue, delegate));
}

}
}
