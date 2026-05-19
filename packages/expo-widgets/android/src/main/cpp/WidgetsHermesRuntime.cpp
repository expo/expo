#include <jni.h>

#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <unordered_map>

namespace jsi = facebook::jsi;

namespace {

struct WidgetsRuntime {
  WidgetsRuntime() {
    auto config = ::hermes::vm::RuntimeConfig::Builder()
      .withEnableSampleProfiling(false)
      .build();
    runtime = facebook::hermes::makeHermesRuntime(config);
  }

  std::unique_ptr<jsi::Runtime> runtime;
  std::mutex mutex;
  std::unordered_map<std::string, std::unique_ptr<jsi::Value>> layoutCache;
};

WidgetsRuntime *runtimeFromHandle(jlong handle) {
  if (handle == 0) {
    throw std::runtime_error("Widgets Hermes runtime has already been released");
  }
  return reinterpret_cast<WidgetsRuntime *>(handle);
}

std::string jstringToString(JNIEnv *env, jstring value) {
  if (value == nullptr) {
    return "";
  }
  const char *chars = env->GetStringUTFChars(value, nullptr);
  if (chars == nullptr) {
    return "";
  }
  std::string result(chars);
  env->ReleaseStringUTFChars(value, chars);
  return result;
}

jstring stringToJString(JNIEnv *env, const std::string &value) {
  return env->NewStringUTF(value.c_str());
}

void throwRuntimeException(JNIEnv *env, const std::string &message) {
  auto exceptionClass = env->FindClass("java/lang/RuntimeException");
  if (exceptionClass != nullptr) {
    env->ThrowNew(exceptionClass, message.c_str());
  }
}

jsi::Value parseJson(jsi::Runtime &rt, const std::string &json) {
  auto jsonObject = rt.global().getPropertyAsObject(rt, "JSON");
  auto parse = jsonObject.getPropertyAsFunction(rt, "parse");
  return parse.call(rt, jsi::String::createFromUtf8(rt, json));
}

std::string stringifyJson(jsi::Runtime &rt, const jsi::Value &value) {
  auto jsonObject = rt.global().getPropertyAsObject(rt, "JSON");
  auto stringify = jsonObject.getPropertyAsFunction(rt, "stringify");
  auto stringified = stringify.call(rt, value);
  if (stringified.isUndefined() || stringified.isNull()) {
    return "null";
  }
  return stringified.asString(rt).utf8(rt);
}

jsi::Value evaluateScript(jsi::Runtime &rt, const std::string &script, const std::string &sourceUrl) {
  return rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(script), sourceUrl);
}

void ensureLayoutFunction(WidgetsRuntime *holder, const std::string &layout) {
  if (holder->layoutCache.find(layout) != holder->layoutCache.end()) {
    return;
  }

  auto &rt = *holder->runtime;
  auto layoutValue = evaluateScript(rt, "(" + layout + ")", "expo-widget-layout.js");
  if (!layoutValue.isObject() || !layoutValue.asObject(rt).isFunction(rt)) {
    throw std::runtime_error("Widget layout string did not evaluate to a function");
  }

  holder->layoutCache[layout] = std::make_unique<jsi::Value>(rt, layoutValue);
}

std::string renderWithFunction(
  WidgetsRuntime *holder,
  const std::string &layout,
  const std::string &propsJson,
  const std::string &environmentJson
) {
  auto &rt = *holder->runtime;
  ensureLayoutFunction(holder, layout);

  rt.global().setProperty(rt, "__expoWidgetLayout", jsi::Value(rt, *holder->layoutCache[layout]));

  auto props = parseJson(rt, propsJson);
  auto environment = parseJson(rt, environmentJson);
  jsi::Value args[] = {std::move(props), std::move(environment)};
  const jsi::Value *argsPtr = args;
  auto render = rt.global().getPropertyAsFunction(rt, "__expoWidgetRender");
  auto result = render.call(rt, argsPtr, static_cast<size_t>(2));
  return stringifyJson(rt, result);
}

std::string handlePressWithFunction(
  WidgetsRuntime *holder,
  const std::string &layout,
  const std::string &propsJson,
  const std::string &environmentJson
) {
  auto &rt = *holder->runtime;
  ensureLayoutFunction(holder, layout);

  rt.global().setProperty(rt, "__expoWidgetLayout", jsi::Value(rt, *holder->layoutCache[layout]));

  auto props = parseJson(rt, propsJson);
  auto environment = parseJson(rt, environmentJson);
  jsi::Value args[] = {std::move(props), std::move(environment)};
  const jsi::Value *argsPtr = args;
  auto handler = rt.global().getPropertyAsFunction(rt, "__expoWidgetHandlePress");
  auto result = handler.call(rt, argsPtr, static_cast<size_t>(2));
  return stringifyJson(rt, result);
}

} // namespace

extern "C" JNIEXPORT jlong JNICALL
Java_expo_modules_widgets_jni_WidgetsHermesRuntime_nativeCreate(JNIEnv *env, jobject) {
  try {
    return reinterpret_cast<jlong>(new WidgetsRuntime());
  } catch (const std::exception &error) {
    throwRuntimeException(env, error.what());
    return 0;
  }
}

extern "C" JNIEXPORT void JNICALL
Java_expo_modules_widgets_jni_WidgetsHermesRuntime_nativeRelease(JNIEnv *, jobject, jlong handle) {
  delete reinterpret_cast<WidgetsRuntime *>(handle);
}

extern "C" JNIEXPORT void JNICALL
Java_expo_modules_widgets_jni_WidgetsHermesRuntime_nativeEvaluateVoid(
  JNIEnv *env,
  jobject,
  jlong handle,
  jstring script,
  jstring sourceUrl
) {
  try {
    auto holder = runtimeFromHandle(handle);
    std::scoped_lock lock(holder->mutex);
    evaluateScript(*holder->runtime, jstringToString(env, script), jstringToString(env, sourceUrl));
  } catch (const jsi::JSError &error) {
    throwRuntimeException(env, error.getMessage());
  } catch (const std::exception &error) {
    throwRuntimeException(env, error.what());
  }
}

extern "C" JNIEXPORT jstring JNICALL
Java_expo_modules_widgets_jni_WidgetsHermesRuntime_nativeRender(
        JNIEnv *env,
        jobject,
        jlong handle,
        jstring layout,
        jstring propsJson,
        jstring environmentJson
) {
  try {
    auto holder = runtimeFromHandle(handle);
    std::scoped_lock lock(holder->mutex);
    return stringToJString(
            env,
            renderWithFunction(
                    holder,
                    jstringToString(env, layout),
                    jstringToString(env, propsJson),
                    jstringToString(env, environmentJson)
            )
    );
  } catch (const jsi::JSError &error) {
    throwRuntimeException(env, error.getMessage());
  } catch (const std::exception &error) {
    throwRuntimeException(env, error.what());
  }
  return nullptr;
}
