#include "ReanimatedHermesRuntime.h"

// Only include this file in Hermes-enabled builds as some platforms (like tvOS)
// don't support hermes and it causes the compilation to fail.
#if JS_RUNTIME_HERMES

#include <cxxreact/MessageQueueThread.h>
#include <jsi/decorator.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <utility>

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#include <reacthermes/HermesExecutorFactory.h>
#else // __has_include(<hermes/hermes.h>) || ANDROID
#include <hermes/hermes.h>
#endif

#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/Registration.h>

namespace reanimated {

using namespace facebook;
using namespace react;

#if HERMES_ENABLE_DEBUGGER

class HermesExecutorRuntimeAdapter
    : public facebook::hermes::inspector::RuntimeAdapter {
 public:
  explicit HermesExecutorRuntimeAdapter(
      facebook::hermes::HermesRuntime &hermesRuntime,
      const std::shared_ptr<MessageQueueThread> &thread)
      : hermesRuntime_(hermesRuntime), thread_(std::move(thread)) {}

  virtual ~HermesExecutorRuntimeAdapter() {
    // This is required by iOS, because there is an assertion in the destructor
    // that the thread was indeed `quit` before
    thread_->quitSynchronous();
  }

#if REACT_NATIVE_MINOR_VERSION >= 71
  facebook::hermes::HermesRuntime &getRuntime() override {
    return hermesRuntime_;
  }
#else
  facebook::jsi::Runtime &getRuntime() override {
    return hermesRuntime_;
  }

  facebook::hermes::debugger::Debugger &getDebugger() override {
    return hermesRuntime_.getDebugger();
  }
#endif // REACT_NATIVE_MINOR_VERSION

  // This is not empty in the original implementation, but we decided to tickle
  // the runtime by running a small piece of code on every frame as using this
  // required us to hold a refernce to the runtime inside this adapter which
  // caused issues while reloading the app.
  void tickleJs() override {}

 public:
  facebook::hermes::HermesRuntime &hermesRuntime_;
  std::shared_ptr<MessageQueueThread> thread_;
};

#endif // HERMES_ENABLE_DEBUGGER

ReanimatedHermesRuntime::ReanimatedHermesRuntime(
    std::unique_ptr<facebook::hermes::HermesRuntime> runtime,
    const std::shared_ptr<MessageQueueThread> &jsQueue,
    const std::string &name)
    : jsi::WithRuntimeDecorator<ReanimatedReentrancyCheck>(
          *runtime,
          reentrancyCheck_),
      runtime_(std::move(runtime)) {
#if HERMES_ENABLE_DEBUGGER
  auto adapter =
      std::make_unique<HermesExecutorRuntimeAdapter>(*runtime_, jsQueue);
#if REACT_NATIVE_MINOR_VERSION >= 71
  debugToken_ = facebook::hermes::inspector::chrome::enableDebugging(
      std::move(adapter), name);
#else
  facebook::hermes::inspector::chrome::enableDebugging(
      std::move(adapter), name);
#endif // REACT_NATIVE_MINOR_VERSION
#else
  // This is required by iOS, because there is an assertion in the destructor
  // that the thread was indeed `quit` before
  jsQueue->quitSynchronous();
#endif // HERMES_ENABLE_DEBUGGER

#ifdef DEBUG
  facebook::hermes::HermesRuntime *wrappedRuntime = runtime_.get();
  jsi::Value evalWithSourceMap = jsi::Function::createFromHostFunction(
      *runtime_,
      jsi::PropNameID::forAscii(*runtime_, "evalWithSourceMap"),
      3,
      [wrappedRuntime](
          jsi::Runtime &rt,
          const jsi::Value &thisValue,
          const jsi::Value *args,
          size_t count) -> jsi::Value {
        auto code = std::make_shared<const jsi::StringBuffer>(
            args[0].asString(rt).utf8(rt));
        std::string sourceURL;
        if (count > 1 && args[1].isString()) {
          sourceURL = args[1].asString(rt).utf8(rt);
        }
        std::shared_ptr<const jsi::Buffer> sourceMap;
        if (count > 2 && args[2].isString()) {
          sourceMap = std::make_shared<const jsi::StringBuffer>(
              args[2].asString(rt).utf8(rt));
        }
        return wrappedRuntime->evaluateJavaScriptWithSourceMap(
            code, sourceMap, sourceURL);
      });
  runtime_->global().setProperty(
      *runtime_, "evalWithSourceMap", evalWithSourceMap);
#endif // DEBUG
}

ReanimatedHermesRuntime::~ReanimatedHermesRuntime() {
#if HERMES_ENABLE_DEBUGGER
  // We have to disable debugging before the runtime is destroyed.
#if REACT_NATIVE_MINOR_VERSION >= 71
  facebook::hermes::inspector::chrome::disableDebugging(debugToken_);
#else
  facebook::hermes::inspector::chrome::disableDebugging(*runtime_);
#endif // REACT_NATIVE_MINOR_VERSION
#endif // HERMES_ENABLE_DEBUGGER
}

} // namespace reanimated

#endif // JS_RUNTIME_HERMES
