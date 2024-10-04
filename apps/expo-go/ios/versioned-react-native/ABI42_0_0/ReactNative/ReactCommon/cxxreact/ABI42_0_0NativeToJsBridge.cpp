/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0NativeToJsBridge.h"

#include <ABI42_0_0ReactCommon/ABI42_0_0CallInvoker.h>
#include <folly/MoveWrapper.h>
#include <folly/json.h>
#include <glog/logging.h>

#include "ABI42_0_0Instance.h"
#include "ABI42_0_0JSBigString.h"
#include "ABI42_0_0MessageQueueThread.h"
#include "ABI42_0_0MethodCall.h"
#include "ABI42_0_0ModuleRegistry.h"
#include "ABI42_0_0RAMBundleRegistry.h"
#include "ABI42_0_0SystraceSection.h"

#include <memory>

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceAsyncFlow;
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

// This class manages calls from JS to native code.
class JsToNativeBridge : public ABI42_0_0React::ExecutorDelegate {
 public:
  JsToNativeBridge(
      std::shared_ptr<ModuleRegistry> registry,
      std::shared_ptr<InstanceCallback> callback)
      : m_registry(registry), m_callback(callback) {}

  std::shared_ptr<ModuleRegistry> getModuleRegistry() override {
    return m_registry;
  }

  bool isBatchActive() {
    return m_batchHadNativeModuleOrTurboModuleCalls;
  }

  void callNativeModules(
      __unused JSExecutor &executor,
      folly::dynamic &&calls,
      bool isEndOfBatch) override {
    CHECK(m_registry || calls.empty())
        << "native module calls cannot be completed with no native modules";
    m_batchHadNativeModuleOrTurboModuleCalls =
        m_batchHadNativeModuleOrTurboModuleCalls || !calls.empty();

    // An exception anywhere in here stops processing of the batch.  This
    // was the behavior of the Android bridge, and since exception handling
    // terminates the whole bridge, there's not much point in continuing.
    for (auto &call : parseMethodCalls(std::move(calls))) {
      m_registry->callNativeMethod(
          call.moduleId, call.methodId, std::move(call.arguments), call.callId);
    }
    if (isEndOfBatch) {
      // onBatchComplete will be called on the native (module) queue, but
      // decrementPendingJSCalls will be called sync. Be aware that the bridge
      // may still be processing native calls when the bridge idle signaler
      // fires.
      if (m_batchHadNativeModuleOrTurboModuleCalls) {
        m_callback->onBatchComplete();
        m_batchHadNativeModuleOrTurboModuleCalls = false;
      }
      m_callback->decrementPendingJSCalls();
    }
  }

  MethodCallResult callSerializableNativeHook(
      __unused JSExecutor &executor,
      unsigned int moduleId,
      unsigned int methodId,
      folly::dynamic &&args) override {
    return m_registry->callSerializableNativeHook(
        moduleId, methodId, std::move(args));
  }

  void recordTurboModuleAsyncMethodCall() {
    m_batchHadNativeModuleOrTurboModuleCalls = true;
  }

 private:
  // These methods are always invoked from an Executor.  The NativeToJsBridge
  // keeps a reference to the executor, and when destroy() is called, the
  // executor is destroyed synchronously on its queue.
  std::shared_ptr<ModuleRegistry> m_registry;
  std::shared_ptr<InstanceCallback> m_callback;
  bool m_batchHadNativeModuleOrTurboModuleCalls = false;
};

NativeToJsBridge::NativeToJsBridge(
    JSExecutorFactory *jsExecutorFactory,
    std::shared_ptr<ModuleRegistry> registry,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::shared_ptr<InstanceCallback> callback)
    : m_destroyed(std::make_shared<bool>(false)),
      m_delegate(std::make_shared<JsToNativeBridge>(registry, callback)),
      m_executor(jsExecutorFactory->createJSExecutor(m_delegate, jsQueue)),
      m_executorMessageQueueThread(std::move(jsQueue)),
      m_inspectable(m_executor->isInspectable()) {}

// This must be called on the same thread on which the constructor was called.
NativeToJsBridge::~NativeToJsBridge() {
  CHECK(*m_destroyed)
      << "NativeToJsBridge::destroy() must be called before deallocating the NativeToJsBridge!";
}

void NativeToJsBridge::initializeRuntime() {
  runOnExecutorQueue(
      [](JSExecutor *executor) mutable { executor->initializeRuntime(); });
}

void NativeToJsBridge::loadBundle(
    std::unique_ptr<RAMBundleRegistry> bundleRegistry,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {
  runOnExecutorQueue(
      [this,
       bundleRegistryWrap = folly::makeMoveWrapper(std::move(bundleRegistry)),
       startupScript = folly::makeMoveWrapper(std::move(startupScript)),
       startupScriptSourceURL =
           std::move(startupScriptSourceURL)](JSExecutor *executor) mutable {
        auto bundleRegistry = bundleRegistryWrap.move();
        if (bundleRegistry) {
          executor->setBundleRegistry(std::move(bundleRegistry));
        }
        try {
          executor->loadBundle(
              std::move(*startupScript), std::move(startupScriptSourceURL));
        } catch (...) {
          m_applicationScriptHasFailure = true;
          throw;
        }
      });
}

void NativeToJsBridge::loadBundleSync(
    std::unique_ptr<RAMBundleRegistry> bundleRegistry,
    std::unique_ptr<const JSBigString> startupScript,
    std::string startupScriptSourceURL) {
  if (bundleRegistry) {
    m_executor->setBundleRegistry(std::move(bundleRegistry));
  }
  try {
    m_executor->loadBundle(
        std::move(startupScript), std::move(startupScriptSourceURL));
  } catch (...) {
    m_applicationScriptHasFailure = true;
    throw;
  }
}

void NativeToJsBridge::callFunction(
    std::string &&module,
    std::string &&method,
    folly::dynamic &&arguments) {
  int systraceCookie = -1;
#ifdef WITH_FBSYSTRACE
  systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCall", systraceCookie);
#endif

  runOnExecutorQueue([this,
                      module = std::move(module),
                      method = std::move(method),
                      arguments = std::move(arguments),
                      systraceCookie](JSExecutor *executor) {
    if (m_applicationScriptHasFailure) {
      LOG(ERROR)
          << "Attempting to call JS function on a bad application bundle: "
          << module.c_str() << "." << method.c_str() << "()";
      throw std::runtime_error(
          "Attempting to call JS function on a bad application bundle: " +
          module + "." + method + "()");
    }

#ifdef WITH_FBSYSTRACE
    FbSystraceAsyncFlow::end(
        TRACE_TAG_REACT_CXX_BRIDGE, "JSCall", systraceCookie);
    SystraceSection s(
        "NativeToJsBridge::callFunction", "module", module, "method", method);
#else
    (void)(systraceCookie);
#endif
    // This is safe because we are running on the executor's thread: it won't
    // destruct until after it's been unregistered (which we check above) and
    // that will happen on this thread
    executor->callFunction(module, method, arguments);
  });
}

void NativeToJsBridge::invokeCallback(
    double callbackId,
    folly::dynamic &&arguments) {
  int systraceCookie = -1;
#ifdef WITH_FBSYSTRACE
  systraceCookie = m_systraceCookie++;
  FbSystraceAsyncFlow::begin(
      TRACE_TAG_REACT_CXX_BRIDGE, "<callback>", systraceCookie);
#endif

  runOnExecutorQueue(
      [this, callbackId, arguments = std::move(arguments), systraceCookie](
          JSExecutor *executor) {
        if (m_applicationScriptHasFailure) {
          LOG(ERROR)
              << "Attempting to call JS callback on a bad application bundle: "
              << callbackId;
          throw std::runtime_error(
              "Attempting to invoke JS callback on a bad application bundle.");
        }
#ifdef WITH_FBSYSTRACE
        FbSystraceAsyncFlow::end(
            TRACE_TAG_REACT_CXX_BRIDGE, "<callback>", systraceCookie);
        SystraceSection s("NativeToJsBridge::invokeCallback");
#else
        (void)(systraceCookie);
#endif
        executor->invokeCallback(callbackId, arguments);
      });
}

void NativeToJsBridge::registerBundle(
    uint32_t bundleId,
    const std::string &bundlePath) {
  runOnExecutorQueue([bundleId, bundlePath](JSExecutor *executor) {
    executor->registerBundle(bundleId, bundlePath);
  });
}

void NativeToJsBridge::setGlobalVariable(
    std::string propName,
    std::unique_ptr<const JSBigString> jsonValue) {
  runOnExecutorQueue([propName = std::move(propName),
                      jsonValue = folly::makeMoveWrapper(std::move(jsonValue))](
                         JSExecutor *executor) mutable {
    executor->setGlobalVariable(propName, jsonValue.move());
  });
}

void *NativeToJsBridge::getJavaScriptContext() {
  // TODO(cjhopman): this seems unsafe unless we require that it is only called
  // on the main js queue.
  return m_executor->getJavaScriptContext();
}

bool NativeToJsBridge::isInspectable() {
  return m_inspectable;
}

bool NativeToJsBridge::isBatchActive() {
  return m_delegate->isBatchActive();
}

void NativeToJsBridge::handleMemoryPressure(int pressureLevel) {
  runOnExecutorQueue([=](JSExecutor *executor) {
    executor->handleMemoryPressure(pressureLevel);
  });
}

void NativeToJsBridge::destroy() {
  // All calls made through runOnExecutorQueue have an early exit if
  // m_destroyed is true. Setting this before the runOnQueueSync will cause
  // pending work to be cancelled and we won't have to wait for it.
  *m_destroyed = true;
  m_executorMessageQueueThread->runOnQueueSync([this] {
    m_executor->destroy();
    m_executorMessageQueueThread->quitSynchronous();
    m_executor = nullptr;
  });
}

void NativeToJsBridge::runOnExecutorQueue(
    std::function<void(JSExecutor *)> task) {
  if (*m_destroyed) {
    return;
  }

  std::shared_ptr<bool> isDestroyed = m_destroyed;
  m_executorMessageQueueThread->runOnQueue(
      [this, isDestroyed, task = std::move(task)] {
        if (*isDestroyed) {
          return;
        }

        // The executor is guaranteed to be valid for the duration of the task
        // because:
        // 1. the executor is only destroyed after it is unregistered
        // 2. the executor is unregistered on this queue
        // 3. we just confirmed that the executor hasn't been unregistered above
        task(m_executor.get());
      });
}

std::shared_ptr<CallInvoker> NativeToJsBridge::getDecoratedNativeCallInvoker(
    std::shared_ptr<CallInvoker> nativeInvoker) {
  class NativeCallInvoker : public CallInvoker {
   private:
    std::weak_ptr<JsToNativeBridge> m_jsToNativeBridge;
    std::shared_ptr<CallInvoker> m_nativeInvoker;

   public:
    NativeCallInvoker(
        std::weak_ptr<JsToNativeBridge> jsToNativeBridge,
        std::shared_ptr<CallInvoker> nativeInvoker)
        : m_jsToNativeBridge(jsToNativeBridge),
          m_nativeInvoker(nativeInvoker) {}

    void invokeAsync(std::function<void()> &&func) override {
      if (auto strongJsToNativeBridge = m_jsToNativeBridge.lock()) {
        strongJsToNativeBridge->recordTurboModuleAsyncMethodCall();
      }
      m_nativeInvoker->invokeAsync(std::move(func));
    }

    void invokeSync(std::function<void()> &&func) override {
      m_nativeInvoker->invokeSync(std::move(func));
    }
  };

  return std::make_shared<NativeCallInvoker>(m_delegate, nativeInvoker);
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
