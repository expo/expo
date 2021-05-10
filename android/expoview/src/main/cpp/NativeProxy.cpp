#include <memory>
#include <string>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <jsi/JSCRuntime.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/ReadableNativeMap.h>
#include <jsi/JSIDynamic.h>

#include "NativeProxy.h"
#include "AndroidErrorHandler.h"
#include "AndroidScheduler.h"
#include <android/log.h>
#include "PlatformDepMethodsHolder.h"

namespace reanimated
{

using namespace facebook;
using namespace react;

NativeProxy::NativeProxy(
    jni::alias_ref<NativeProxy::javaobject> jThis,
    jsi::Runtime *rt,
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
    std::shared_ptr<Scheduler> scheduler) : javaPart_(jni::make_global(jThis)),
                                            runtime_(rt),
                                            jsCallInvoker_(jsCallInvoker),
                                            scheduler_(scheduler)
{
}

jni::local_ref<NativeProxy::jhybriddata> NativeProxy::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder,
    jni::alias_ref<AndroidScheduler::javaobject> androidScheduler)
{
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);
  return makeCxxInstance(jThis, (jsi::Runtime *)jsContext, jsCallInvoker, scheduler);
}

void NativeProxy::installJSIBindings()
{

  auto propUpdater = [this](jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &props) {
    // viewName is for iOS only, we skip it here
    this->updateProps(rt, viewTag, props);
  };

  auto getCurrentTime = [this]() {
      auto method = javaPart_
                        ->getClass()
                        ->getMethod<local_ref<JString>()>("getUpTime");
      local_ref<JString> output = method(javaPart_.get());
      return (double)std::strtoll(output->toStdString().c_str(), NULL, 10);
  };

  auto requestRender = [this, getCurrentTime](std::function<void(double)> onRender, jsi::Runtime &rt) {
    //doNoUse -> NodesManager passes here a timestamp from choreographer which is useless for us 
    //as we use diffrent timer to better handle events. The lambda is translated to NodeManager.OnAnimationFrame
    //and treated just like reanimated 1 frame callbacks which make use of the timestamp.
    auto wrappedOnRender = [getCurrentTime, &rt, onRender](double doNotUse) { 
       double frameTimestamp = getCurrentTime();
       rt.global().setProperty(rt, "_frameTimestamp", frameTimestamp);
       onRender(frameTimestamp);
       rt.global().setProperty(rt, "_frameTimestamp", jsi::Value::undefined());
    };
    this->requestRender(std::move(wrappedOnRender));
  };

  auto propObtainer = [this](jsi::Runtime &rt, const int viewTag, const jsi::String &propName) -> jsi::Value {
    auto method = javaPart_
                      ->getClass()
                      ->getMethod<jni::local_ref<JString>(int, jni::local_ref<JString>)>("obtainProp");
    local_ref<JString> propNameJStr = jni::make_jstring(propName.utf8(rt).c_str());
    auto result = method(javaPart_.get(), viewTag, propNameJStr);
    std::string str = result->toStdString();
    return jsi::Value(rt, jsi::String::createFromAscii(rt, str.c_str()));
  };

  auto measuringFunction = [this](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag);
  };

  auto scrollToFunction = [this](int viewTag, double x, double y, bool animated) -> void {
    scrollTo(viewTag, x, y, animated);
  };

  std::unique_ptr<jsi::Runtime> animatedRuntime = jsc::makeJSCRuntime();

  std::shared_ptr<ErrorHandler> errorHandler = std::shared_ptr<AndroidErrorHandler>(new AndroidErrorHandler(scheduler_));

  PlatformDepMethodsHolder platformDepMethodsHolder = {
    requestRender,
    propUpdater,
    scrollToFunction,
    measuringFunction,
    getCurrentTime,
  };

  auto module = std::make_shared<NativeReanimatedModule>(jsCallInvoker_,
                                                         scheduler_,
                                                         std::move(animatedRuntime),
                                                         errorHandler,
                                                         propObtainer,
                                                         platformDepMethodsHolder);

  _nativeReanimatedModule = module;

  this->registerEventHandler([module, getCurrentTime](std::string eventName, std::string eventAsString) {
    module->runtime->global().setProperty(*module->runtime, "_eventTimestamp", getCurrentTime());
    module->onEvent(eventName, eventAsString);
    module->runtime->global().setProperty(*module->runtime, "_eventTimestamp", jsi::Value::undefined());
  });

  runtime_->global().setProperty(
      *runtime_,
      jsi::PropNameID::forAscii(*runtime_, "__reanimatedModuleProxy"),
      jsi::Object::createFromHostObject(*runtime_, module));
}

bool NativeProxy::isAnyHandlerWaitingForEvent(std::string s) {
  return _nativeReanimatedModule->isAnyHandlerWaitingForEvent(s);
}

void NativeProxy::registerNatives()
{
  registerHybrid({
      makeNativeMethod("initHybrid", NativeProxy::initHybrid),
      makeNativeMethod("installJSIBindings", NativeProxy::installJSIBindings),
      makeNativeMethod("isAnyHandlerWaitingForEvent", NativeProxy::isAnyHandlerWaitingForEvent)
  });
}

void NativeProxy::requestRender(std::function<void(double)> onRender)
{
  static auto method = javaPart_
                           ->getClass()
                           ->getMethod<void(AnimationFrameCallback::javaobject)>("requestRender");
  method(javaPart_.get(), AnimationFrameCallback::newObjectCxxArgs(std::move(onRender)).get());
}

void NativeProxy::registerEventHandler(std::function<void(std::string, std::string)> handler)
{
  static auto method = javaPart_
                           ->getClass()
                           ->getMethod<void(EventHandler::javaobject)>("registerEventHandler");
  method(javaPart_.get(), EventHandler::newObjectCxxArgs(std::move(handler)).get());
}

struct PropsMap : jni::JavaClass<PropsMap, JMap<JString, JObject>>
{
  static constexpr auto kJavaDescriptor =
      "Ljava/util/HashMap;";

  static local_ref<PropsMap> create()
  {
    return newInstance();
  }

  void put(const std::string &key, jni::local_ref<JObject> object)
  {
    static auto method = getClass()
                             ->getMethod<jobject(jni::local_ref<JObject>, jni::local_ref<JObject>)>("put");
    method(self(), jni::make_jstring(key), object);
  }
};

static jni::local_ref<PropsMap> ConvertToPropsMap(jsi::Runtime &rt, const jsi::Object &props)
{
  auto map = PropsMap::create();

  auto propNames = props.getPropertyNames(rt);
  for (size_t i = 0, size = propNames.size(rt); i < size; i++)
  {
    auto jsiKey = propNames.getValueAtIndex(rt, i).asString(rt);
    auto value = props.getProperty(rt, jsiKey);
    auto key = jsiKey.utf8(rt);
    if (value.isUndefined() || value.isNull())
    {
      map->put(key, nullptr);
    }
    else if (value.isBool())
    {
      map->put(key, JBoolean::valueOf(value.getBool()));
    }
    else if (value.isNumber())
    {
      map->put(key, jni::autobox(value.asNumber()));
    }
    else if (value.isString())
    {
      map->put(key, jni::make_jstring(value.asString(rt).utf8(rt)));
    }
    else if (value.isObject())
    {
      if (value.asObject(rt).isArray(rt))
      {
        map->put(key, ReadableNativeArray::newObjectCxxArgs(jsi::dynamicFromValue(rt, value)));
      }
      else
      {
        map->put(key, ReadableNativeMap::newObjectCxxArgs(jsi::dynamicFromValue(rt, value)));
      }
    }
  }

  return map;
}

void NativeProxy::updateProps(jsi::Runtime &rt, int viewTag, const jsi::Object &props)
{
  auto method = javaPart_
                    ->getClass()
                    ->getMethod<void(int, JMap<JString, JObject>::javaobject)>("updateProps");
  method(javaPart_.get(), viewTag, ConvertToPropsMap(rt, props).get());
}

void NativeProxy::scrollTo(int viewTag, double x, double y, bool animated)
{
  auto method = javaPart_
    ->getClass()
    ->getMethod<void(int, double, double, bool)>("scrollTo");
  method(javaPart_.get(), viewTag, x, y, animated);
}

std::vector<std::pair<std::string, double>> NativeProxy::measure(int viewTag)
{
  auto method = javaPart_
                    ->getClass()
                    ->getMethod<local_ref<JArrayFloat>(int)>("measure");
  local_ref<JArrayFloat> output = method(javaPart_.get(), viewTag);
  size_t size = output->size();
  auto elements = output->getRegion(0, size);
  std::vector<std::pair<std::string, double>> result;

  result.push_back({"x", elements[0]});
  result.push_back({"y", elements[1]});

  result.push_back({"pageX", elements[2]});
  result.push_back({"pageY", elements[3]});

  result.push_back({"width", elements[4]});
  result.push_back({"height", elements[5]});

  return result;
}

} // namespace reanimated
