#include "JSIUtils.h"

namespace expo {

jsi::Runtime* createHermesRuntime() {
  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime();
  jsi::Runtime *runtime = runtimePtr.release();

  // This version of the Hermes uses a Promise implementation that is provided by the RN.
  // The `setImmediate` function isn't defined, but is required by the Promise implementation.
  // That's why we inject it here.
  auto setImmediatePropName = jsi::PropNameID::forUtf8(*runtime, "setImmediate");
  auto setImmediateFunction = jsi::Function::createFromHostFunction(*runtime, setImmediatePropName, 1, [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
    if (count < 1) {
      return jsi::Value::undefined();
    }
    args[0].asObject(rt).asFunction(rt).call(rt);
    return jsi::Value::undefined();
  });
  runtime->global().setProperty(*runtime, setImmediatePropName, setImmediateFunction);

  return runtime;
}

} // namespace expo
