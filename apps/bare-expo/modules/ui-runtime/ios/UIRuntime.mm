#import <Foundation/Foundation.h>
#include <hermes/hermes.h>
#include <stdexcept>
#include "UIRuntime.h"

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

} // namespace expo::ui
