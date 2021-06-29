#include "RuntimeDecorator.h"
#include "ReanimatedHiddenHeaders.h"
#include <unordered_map>
#include <memory>

namespace reanimated {

void RuntimeDecorator::decorateRuntime(jsi::Runtime &rt, std::string label) {
  // This property will be used to find out if a runtime is a custom worklet runtime (e.g. UI, VisionCamera frame processor, ...)
  rt.global().setProperty(rt, "_WORKLET", jsi::Value(true));
  // This property will be used for debugging
  rt.global().setProperty(rt, "_LABEL", jsi::String::createFromAscii(rt, label));

  jsi::Object dummyGlobal(rt);
  auto dummyFunction = [](
                          jsi::Runtime &rt,
                          const jsi::Value &thisValue,
                          const jsi::Value *args,
                          size_t count
                          ) -> jsi::Value {
    return jsi::Value::undefined();
  };
  jsi::Function __reanimatedWorkletInit = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "__reanimatedWorkletInit"), 1, dummyFunction);

  dummyGlobal.setProperty(rt, "__reanimatedWorkletInit", __reanimatedWorkletInit);
  rt.global().setProperty(rt, "global", dummyGlobal);

  rt.global().setProperty(rt, "jsThis", jsi::Value::undefined());

  auto callback = [](
                     jsi::Runtime &rt,
                     const jsi::Value &thisValue,
                     const jsi::Value *args,
                     size_t count
                     ) -> jsi::Value {
    const jsi::Value *value = &args[0];
    if (value->isString()) {
      Logger::log(value->getString(rt).utf8(rt).c_str());
    } else if (value->isNumber()) {
      Logger::log(value->getNumber());
    } else if (value->isUndefined()) {
      Logger::log("undefined");
    } else {
      Logger::log("unsupported value type");
    }
    return jsi::Value::undefined();
  };
  jsi::Value log = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_log"), 1, callback);
  rt.global().setProperty(rt, "_log", log);

  auto setGlobalConsole = [](
                             jsi::Runtime &rt,
                             const jsi::Value &thisValue,
                             const jsi::Value *args,
                             size_t count
                             ) -> jsi::Value {
    rt.global().setProperty(rt, "console", args[0]);
    return jsi::Value::undefined();
  };
  rt.global().setProperty(rt, "_setGlobalConsole", jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_setGlobalConsole"), 1, setGlobalConsole));
}

void RuntimeDecorator::decorateUIRuntime(jsi::Runtime &rt,
                                         UpdaterFunction updater,
                                         RequestFrameFunction requestFrame,
                                         ScrollToFunction scrollTo,
                                         MeasuringFunction measure,
                                         TimeProviderFunction getCurrentTime) {
  RuntimeDecorator::decorateRuntime(rt, "UI");
  rt.global().setProperty(rt, "_UI", jsi::Value(true));

  auto clb = [updater](
                       jsi::Runtime &rt,
                       const jsi::Value &thisValue,
                       const jsi::Value *args,
                       size_t count
                       ) -> jsi::Value {
    const auto viewTag = args[0].asNumber();
    const jsi::Value* viewName = &args[1];
    const auto params = args[2].asObject(rt);
    updater(rt, viewTag, *viewName, params);
    return jsi::Value::undefined();
  };
  jsi::Value updateProps = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_updateProps"), 2, clb);
  rt.global().setProperty(rt, "_updateProps", updateProps);


  auto clb2 = [requestFrame](
                             jsi::Runtime &rt,
                             const jsi::Value &thisValue,
                             const jsi::Value *args,
                             size_t count
                             ) -> jsi::Value {
    auto fun = std::make_shared<jsi::Function>(args[0].asObject(rt).asFunction(rt));
    requestFrame([&rt, fun](double timestampMs) {
      fun->call(rt, jsi::Value(timestampMs));
    });
    return jsi::Value::undefined();
  };
  jsi::Value requestAnimationFrame = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "requestAnimationFrame"), 1, clb2);
  rt.global().setProperty(rt, "requestAnimationFrame", requestAnimationFrame);

  auto clb3 = [scrollTo](
                         jsi::Runtime &rt,
                         const jsi::Value &thisValue,
                         const jsi::Value *args,
                         size_t count
                         ) -> jsi::Value {
    int viewTag = (int)args[0].asNumber();
    double x = args[1].asNumber();
    double y = args[2].asNumber();
    bool animated = args[3].getBool();
    scrollTo(viewTag, x, y, animated);
    return jsi::Value::undefined();
  };
  jsi::Value scrollToFunction = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_scrollTo"), 4, clb3);
  rt.global().setProperty(rt, "_scrollTo", scrollToFunction);

  auto clb4 = [measure](
                        jsi::Runtime &rt,
                        const jsi::Value &thisValue,
                        const jsi::Value *args,
                        size_t count
                        ) -> jsi::Value {
    int viewTag = (int)args[0].asNumber();
    auto result = measure(viewTag);
    jsi::Object resultObject(rt);
    for (auto &i:result) {
      resultObject.setProperty(rt, i.first.c_str(), i.second);
    }
    return resultObject;
  };
  jsi::Value measureFunction = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_measure"), 1, clb4);
  rt.global().setProperty(rt, "_measure", measureFunction);

  auto clb6 = [getCurrentTime](
                               jsi::Runtime &rt,
                               const jsi::Value &thisValue,
                               const jsi::Value *args,
                               size_t count
                               ) -> jsi::Value {
    return getCurrentTime();
  };
  jsi::Value timeFun = jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, "_getCurrentTime"), 0, clb6);
  rt.global().setProperty(rt, "_getCurrentTime", timeFun);

  rt.global().setProperty(rt, "_frameTimestamp", jsi::Value::undefined());
  rt.global().setProperty(rt, "_eventTimestamp", jsi::Value::undefined());
}

bool RuntimeDecorator::isUIRuntime(jsi::Runtime& rt) {
  auto isUi = rt.global().getProperty(rt, "_UI");
  return isUi.isBool() && isUi.getBool();
}

bool RuntimeDecorator::isWorkletRuntime(jsi::Runtime& rt) {
  auto isWorklet = rt.global().getProperty(rt, "_WORKLET");
  return isWorklet.isBool() && isWorklet.getBool();
}

bool RuntimeDecorator::isReactRuntime(jsi::Runtime& rt) {
  return !isWorkletRuntime(rt);
}

}
