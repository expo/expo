#include "JSIUtils.h"

#if __has_include(<hermes/hermes.h>)
#include <hermes/hermes.h>
#elif defined(_WIN32)
// react-native-windows ships Hermes as `hermes.dll` with a C API and wraps it in a `jsi::Runtime`
// with these sources from its `Microsoft.ReactNative.Cxx` NuGet package.
#include <ApiLoaders/JSRuntimeApi.h>
#include <NodeApiJsiRuntime.h>
#include <jsi/decorator.h>
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

namespace {

using Microsoft::NodeApiJsi::JSRuntimeApi;

/**
 Makes `api` the current `JSRuntimeApi` of the calling thread. The runtime that
 `makeNodeApiJsiRuntime` returns reaches Hermes through the thread's current API, which
 react-native-windows sets only on its JavaScript thread.
 */
struct CurrentJSRuntimeApi {
  JSRuntimeApi *api;

  void before() {
    JSRuntimeApi::setCurrent(api);
  }
};

/**
 Owns a runtime from `makeNodeApiJsiRuntime` and forwards to it, setting the current `JSRuntimeApi`
 first, so it works from any thread. `instrumentation().collectGarbage(_:)` runs a collection: the
 wrapped runtime keeps the default instrumentation, which does nothing.
 */
class HermesRuntime : public jsi::WithRuntimeDecorator<CurrentJSRuntimeApi> {
public:
  HermesRuntime(std::unique_ptr<jsi::Runtime> runtime, JSRuntimeApi *api, napi_env env)
      : WithRuntimeDecorator(*runtime, currentApi_), runtime_(std::move(runtime)), currentApi_{api}, env_(env) {}

  ~HermesRuntime() override {
    // Deleting the wrapped runtime, after this body, calls into Hermes too.
    currentApi_.before();
  }

private:
  void collectGarbage(std::string cause) override {
    currentApi_.before();
    Microsoft::NodeApiJsi::NodeApiEnvScope envScope(env_);
    {
      // The wrapped runtime drops the Node-API references of released values only when a scope
      // ends. Ending one here lets the collection free the objects that nothing else references.
      jsi::Scope scope(plain());
    }
    currentApi_.api->jsr_collect_garbage(env_);
  }

  std::unique_ptr<jsi::Runtime> runtime_;
  CurrentJSRuntimeApi currentApi_;
  napi_env env_;
};

} // namespace

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
  std::unique_ptr<jsi::Runtime> nodeApiRuntime = makeNodeApiJsiRuntime(env, api, [jsrRuntime]() {
    api->jsr_delete_runtime(jsrRuntime);
  });
  jsi::Runtime *runtime = new HermesRuntime(std::move(nodeApiRuntime), api, env);
  installSetImmediate(*runtime);
  return runtime;
}

#endif

} // namespace expo
