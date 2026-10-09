#include "JSIUtils.h"

#if __has_include(<hermes/hermes.h>)
#include <hermes/hermes.h>
#elif defined(_WIN32)
// react-native-windows ships Hermes as `hermes.dll` with a C API and wraps it in a `jsi::Runtime`
// with these sources from its `Microsoft.ReactNative.Cxx` NuGet package.
#include <ApiLoaders/JSRuntimeApi.h>
#include <NodeApiJsiRuntime.h>
#endif

namespace expo {

namespace {

/**
 Defines the global `setImmediate` function. This version of Hermes uses a Promise implementation
 that is provided by React Native. The `setImmediate` function isn't defined, but is required by
 the Promise implementation.
 */
void installSetImmediate(jsi::Runtime &runtime) {
  auto setImmediatePropName = jsi::PropNameID::forUtf8(runtime, "setImmediate");
  auto setImmediateFunction = jsi::Function::createFromHostFunction(runtime, setImmediatePropName, 1, [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
    if (count < 1) {
      return jsi::Value::undefined();
    }
    args[0].asObject(rt).asFunction(rt).call(rt);
    return jsi::Value::undefined();
  });
  runtime.global().setProperty(runtime, setImmediatePropName, setImmediateFunction);
}

} // namespace

#if __has_include(<hermes/hermes.h>)

jsi::Runtime* createHermesRuntime() {
  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime();
  jsi::Runtime *runtime = runtimePtr.release();
  installSetImmediate(*runtime);
  return runtime;
}

#elif defined(_WIN32)

jsi::Runtime* createHermesRuntime() {
  using namespace Microsoft::NodeApiJsi;

  // Loads `hermes.dll` on first use, the same way react-native-windows does. The API object is
  // shared by all runtimes and lives as long as the process.
  static JSRuntimeApi *api = new JSRuntimeApi(new LibFuncResolver("hermes.dll"));
  JSRuntimeApi::setCurrent(api);

  jsr_config config{};
  api->jsr_create_config(&config);
  api->jsr_config_enable_gc_api(config, true);
  jsr_runtime jsrRuntime{};
  api->jsr_create_runtime(config, &jsrRuntime);
  api->jsr_delete_config(config);

  napi_env env{};
  api->jsr_runtime_get_node_api_env(jsrRuntime, &env);

  // `destroyRuntime` deletes the returned runtime, which calls this to delete the Hermes runtime.
  jsi::Runtime *runtime = makeNodeApiJsiRuntime(env, api, [jsrRuntime]() {
    api->jsr_delete_runtime(jsrRuntime);
  }).release();
  installSetImmediate(*runtime);
  return runtime;
}

#endif

} // namespace expo
