#include <fbjni/fbjni.h>
#include <hermes/hermes.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>

#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <unordered_map>

namespace jsi = facebook::jsi;
namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo::widgets {
  std::optional<std::string> jstringToOptionalString(const jni::alias_ref<jstring> &value) {
    if (!value) {
      return std::nullopt;
    }
    return value->toStdString();
  }

  void throwRuntimeException(const std::string &message) {
    jni::throwNewJavaException("java/lang/RuntimeException", message.c_str());
  }

  jsi::Value parseJson(jsi::Runtime &rt, const std::string &json) {
    auto jsonObject = rt.global().getPropertyAsObject(rt, "JSON");
    auto parse = jsonObject.getPropertyAsFunction(rt, "parse");
    return parse.call(rt, jsi::String::createFromUtf8(rt, json));
  }

  jsi::Value parseJsonOrUndefined(jsi::Runtime &rt, const std::optional<std::string> &json) {
    if (!json.has_value()) {
      return jsi::Value::undefined();
    }
    return parseJson(rt, *json);
  }

  jsi::Value readableMapToValue(
    jsi::Runtime &rt,
    const jni::alias_ref<react::ReadableNativeMap::javaobject> &map
  ) {
    if (!map) {
      return jsi::Value::undefined();
    }

    return jsi::valueFromDynamic(rt, map->cthis()->consume());
  }

  jsi::Value evaluateScript(jsi::Runtime &rt, const std::string &script, const std::string &sourceUrl) {
    return rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(script), sourceUrl);
  }

  class WidgetsHermesRuntime : public jni::HybridClass<WidgetsHermesRuntime> {
  public:
    static constexpr auto kJavaDescriptor = "Lexpo/modules/widgets/jni/WidgetsHermesRuntime;";

    WidgetsHermesRuntime() {
      auto config = ::hermes::vm::RuntimeConfig::Builder()
        .withEnableSampleProfiling(false)
        .build();
      runtime = facebook::hermes::makeHermesRuntime(config);
    }

    static jobject initHybrid(JNIEnv *, jclass) {
      return makeCxxInstance().release();
    }

    static void registerNatives() {
      registerHybrid({
        makeNativeMethod("initHybrid", WidgetsHermesRuntime::initHybrid),
        makeNativeMethod("nativeEvaluateBundle", WidgetsHermesRuntime::nativeEvaluateBundle),
        makeNativeMethod("nativeRender", WidgetsHermesRuntime::nativeRender),
      });
    }

    void nativeEvaluateBundle(
      const jni::alias_ref<jstring> &script,
      const jni::alias_ref<jstring> &sourceUrl
    ) {
      try {
        std::scoped_lock lock(mutex);
        evaluateScript(*runtime, script->toStdString(), sourceUrl->toStdString());
      } catch (const jsi::JSError &error) {
        throwRuntimeException(error.getMessage());
      } catch (const std::exception &error) {
        throwRuntimeException(error.what());
      }
    }

    jni::local_ref<react::ReadableNativeMap::jhybridobject> nativeRender(
      const jni::alias_ref<jstring> &layout,
      const jni::alias_ref<jstring> &propsJson,
      const jni::alias_ref<react::ReadableNativeMap::javaobject> &environment
    ) {
      try {
        std::scoped_lock lock(mutex);
        return renderWithFunction(
          layout->toStdString(),
          jstringToOptionalString(propsJson),
          environment
        );
      } catch (const jsi::JSError &error) {
        throwRuntimeException(error.getMessage());
      } catch (const std::exception &error) {
        throwRuntimeException(error.what());
      }
      return nullptr;
    }

  private:
    std::unique_ptr<jsi::Runtime> runtime;
    std::mutex mutex;
    std::unordered_map<std::string, std::unique_ptr<jsi::Value>> layoutCache;

    void ensureLayoutFunction(const std::string &layout) {
      if (layoutCache.contains(layout)) {
        return;
      }

      auto layoutValue = evaluateScript(*runtime, "(" + layout + ")", "expo-widget-layout.js");
      if (!layoutValue.isObject() || !layoutValue.asObject(*runtime).isFunction(*runtime)) {
        throw std::runtime_error("Widget layout string did not evaluate to a function");
      }

      layoutCache.emplace(layout, std::make_unique<jsi::Value>(*runtime, layoutValue));
    }

    jni::local_ref<react::ReadableNativeMap::jhybridobject> renderWithFunction(
      const std::string &layout,
      const std::optional<std::string> &propsJson,
      const jni::alias_ref<react::ReadableNativeMap::javaobject> &environmentMap
    ) {
      auto &rt = *runtime;
      ensureLayoutFunction(layout);

      rt.global().setProperty(rt, "__expoWidgetLayout", jsi::Value(rt, *layoutCache.at(layout)));

      auto props = parseJsonOrUndefined(rt, propsJson);
      auto environment = readableMapToValue(rt, environmentMap);
      jsi::Value args[] = {std::move(props), std::move(environment)};
      const jsi::Value *argsPtr = args;
      auto render = rt.global().getPropertyAsFunction(rt, "__expoWidgetRender");
      auto result = render.call(rt, argsPtr, static_cast<size_t>(2));
      if (!result.isObject()) {
        throw std::runtime_error("Widget render function must return an object");
      }

      auto dynamic = jsi::dynamicFromValue(rt, result);
      return react::ReadableNativeMap::createWithContents(std::move(dynamic));
    }
  };
} // namespace expo::widgets

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return jni::initialize(vm, [] {
    expo::widgets::WidgetsHermesRuntime::registerNatives();
  });
}
