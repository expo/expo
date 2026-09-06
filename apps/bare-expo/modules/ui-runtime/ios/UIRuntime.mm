#import <Foundation/Foundation.h>
#include <hermes/hermes.h>
#include <stdexcept>
#include "UIRuntime.h"
#include "UIExecutionQueue.h"
#include <chrono>
#include <cmath>

namespace expo::ui {
namespace jsi = facebook::jsi;

void UIRuntime::requireUIThread()
{
  // A real runtime check, not a debug-only assertion. Never dispatch_sync or
  // borrow another runtime: the caller must already be on the owner thread.
  if (!NSThread.isMainThread) {
    throw std::logic_error("UIRuntime must be accessed on the UI thread");
  }
}

UIRuntime::UIRuntime()
{
  requireUIThread();
  runtime_ = facebook::hermes::makeHermesRuntime();

  // Diagnostic only: proves that a native call made FROM this JS executes on UI.
  runtime_->global().setProperty(*runtime_, "__isUIThread",
      jsi::Function::createFromHostFunction(*runtime_,
          jsi::PropNameID::forAscii(*runtime_, "__isUIThread"), 0,
          [](jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
            return (bool)NSThread.isMainThread;
          }));
}

UIRuntime::~UIRuntime()
{
  // Destructors cannot safely report a recoverable exception. Fail fast on an
  // ownership bug instead of destroying Hermes on an arbitrary thread.
  if (!NSThread.isMainThread) std::terminate();
  runtime_.reset();
}

std::string UIRuntime::evaluateJSON(const std::string &source)
{
  requireUIThread();
  if (!runtime_) throw std::logic_error("UIRuntime is closed");

  auto &runtime = *runtime_;
  auto result = runtime.evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(source), "ui-runtime://step-1");
  auto json = runtime.global().getPropertyAsObject(runtime, "JSON");
  auto encoded = json.getPropertyAsFunction(runtime, "stringify").call(runtime, result);
  if (!encoded.isString()) {
    throw std::invalid_argument("The script must return a JSON-serializable value");
  }
  return encoded.asString(runtime).utf8(runtime);
}

void UIRuntime::close()
{
  requireUIThread();
  runtime_.reset();
}

void UIRuntime::loadScript(const std::string &source, const std::string &sourceURL)
{
  requireUIThread();
  if (!runtime_) throw std::logic_error("UIRuntime is closed");
  runtime_->evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), sourceURL);
}

void UIRuntime::installTaskScheduling(UIExecutionQueue &queue)
{
  requireUIThread();
  if (!runtime_) throw std::logic_error("UIRuntime is closed");
  auto &runtime = *runtime_;
  if (runtime.global().hasProperty(runtime, "__postUITask")) {
    throw std::logic_error("Task scheduling is already installed");
  }
  std::weak_ptr<jsi::Runtime> weakRuntime = runtime_;
  auto dispatch = queue.dispatcher();
  runtime.global().setProperty(runtime, "__postUITask",
      jsi::Function::createFromHostFunction(runtime,
          jsi::PropNameID::forAscii(runtime, "__postUITask"), 1,
          [weakRuntime, dispatch](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) -> jsi::Value {
            requireUIThread();
            if (count != 1 || !args[0].isNumber() || !std::isfinite(args[0].getNumber())) {
              throw jsi::JSError(rt, "A numeric UI task ID is required");
            }
            double id = args[0].getNumber();
            try {
              dispatch([weakRuntime, id] {
                // No JSI handle is retained by the queue. Closing the runtime
                // releases its entire callback registry; late jobs are no-ops.
                if (auto runtime = weakRuntime.lock()) {
                  runtime->global().getPropertyAsFunction(*runtime, "__runUITask").call(*runtime, id);
                }
              });
            } catch (const std::exception &error) {
              throw jsi::JSError(rt, error.what());
            }
            return jsi::Value::undefined();
          }));
  runtime.global().setProperty(runtime, "__uiNow",
      jsi::Function::createFromHostFunction(runtime,
          jsi::PropNameID::forAscii(runtime, "__uiNow"), 0,
          [](jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t) -> jsi::Value {
            return std::chrono::duration<double, std::milli>(
                std::chrono::steady_clock::now().time_since_epoch()).count();
          }));
}

} // namespace expo::ui
