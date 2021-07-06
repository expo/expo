#include "NativeReanimatedModule.h"
#include "ShareableValue.h"
#include "MapperRegistry.h"
#include "Mapper.h"
#include "RuntimeDecorator.h"
#include "EventHandlerRegistry.h"
#include "WorkletEventHandler.h"
#include "FrozenObject.h"
#include <functional>
#include <thread>
#include <memory>
#include "JSIStoreValueUser.h"

using namespace facebook;

namespace reanimated
{

void extractMutables(jsi::Runtime &rt,
                     std::shared_ptr<ShareableValue> sv,
                     std::vector<std::shared_ptr<MutableValue>> &res)
{
  switch (sv->type)
  {
  case ValueType::MutableValueType: {
    auto& mutableValue = ValueWrapper::asMutableValue(sv->valueContainer);
    res.push_back(mutableValue);
    break;
  }
  case ValueType::FrozenArrayType:
    for (auto &it : ValueWrapper::asFrozenArray(sv->valueContainer))
    {
      extractMutables(rt, it, res);
    }
    break;
  case ValueType::RemoteObjectType:
  case ValueType::FrozenObjectType:
    for (auto &it : ValueWrapper::asFrozenObject(sv->valueContainer)->map)
    {
      extractMutables(rt, it.second, res);
    }
    break;
  default:
    break;
  }
}

std::vector<std::shared_ptr<MutableValue>> extractMutablesFromArray(jsi::Runtime &rt, const jsi::Array &array, NativeReanimatedModule *module)
{
  std::vector<std::shared_ptr<MutableValue>> res;
  for (size_t i = 0, size = array.size(rt); i < size; i++)
  {
    auto shareable = ShareableValue::adapt(rt, array.getValueAtIndex(rt, i), module);
    extractMutables(rt, shareable, res);
  }
  return res;
}

NativeReanimatedModule::NativeReanimatedModule(std::shared_ptr<CallInvoker> jsInvoker,
                                               std::shared_ptr<Scheduler> scheduler,
                                               std::unique_ptr<jsi::Runtime> rt,
                                               std::shared_ptr<ErrorHandler> errorHandler,
                                               std::function<jsi::Value(jsi::Runtime &, const int, const jsi::String &)> propObtainer,
                                               PlatformDepMethodsHolder platformDepMethodsHolder) :
                                                  NativeReanimatedModuleSpec(jsInvoker),
                                                  RuntimeManager(std::move(rt), errorHandler, scheduler),
                                                  mapperRegistry(std::make_shared<MapperRegistry>()),
                                                  eventHandlerRegistry(std::make_shared<EventHandlerRegistry>()),
                                                  requestRender(platformDepMethodsHolder.requestRender),
                                                  propObtainer(propObtainer)
{

  auto requestAnimationFrame = [=](FrameCallback callback) {
    frameCallbacks.push_back(callback);
    maybeRequestRender();
  };
  RuntimeDecorator::decorateUIRuntime(*runtime,
                                      platformDepMethodsHolder.updaterFunction,
                                      requestAnimationFrame,
                                      platformDepMethodsHolder.scrollToFunction,
                                      platformDepMethodsHolder.measuringFunction,
                                      platformDepMethodsHolder.getCurrentTime);
}

void NativeReanimatedModule::installCoreFunctions(jsi::Runtime &rt, const jsi::Value &valueSetter)
{
  this->valueSetter = ShareableValue::adapt(rt, valueSetter, this);
}

jsi::Value NativeReanimatedModule::makeShareable(jsi::Runtime &rt, const jsi::Value &value)
{
  return ShareableValue::adapt(rt, value, this)->getValue(rt);
}

jsi::Value NativeReanimatedModule::makeMutable(jsi::Runtime &rt, const jsi::Value &value)
{
  return ShareableValue::adapt(rt, value, this, ValueType::MutableValueType)->getValue(rt);
}

jsi::Value NativeReanimatedModule::makeRemote(jsi::Runtime &rt, const jsi::Value &value)
{
  return ShareableValue::adapt(rt, value, this, ValueType::RemoteObjectType)->getValue(rt);
}

jsi::Value NativeReanimatedModule::startMapper(jsi::Runtime &rt, const jsi::Value &worklet, const jsi::Value &inputs, const jsi::Value &outputs)
{
  static unsigned long MAPPER_ID = 1;

  unsigned long newMapperId = MAPPER_ID++;
  auto mapperShareable = ShareableValue::adapt(rt, worklet, this);
  auto inputMutables = extractMutablesFromArray(rt, inputs.asObject(rt).asArray(rt), this);
  auto outputMutables = extractMutablesFromArray(rt, outputs.asObject(rt).asArray(rt), this);

  scheduler->scheduleOnUI([=] {
    auto mapperFunction = mapperShareable->getValue(*runtime).asObject(*runtime).asFunction(*runtime);
    std::shared_ptr<jsi::Function> mapperFunctionPointer = std::make_shared<jsi::Function>(std::move(mapperFunction));
    std::shared_ptr<Mapper> mapperPointer = std::make_shared<Mapper>(this, newMapperId, mapperFunctionPointer, inputMutables, outputMutables);
    mapperRegistry->startMapper(mapperPointer);
    maybeRequestRender();
  });

  return jsi::Value((double)newMapperId);
}

void NativeReanimatedModule::stopMapper(jsi::Runtime &rt, const jsi::Value &mapperId)
{
  unsigned long id = mapperId.asNumber();
  scheduler->scheduleOnUI([=] {
    mapperRegistry->stopMapper(id);
    maybeRequestRender();
  });
}

jsi::Value NativeReanimatedModule::registerEventHandler(jsi::Runtime &rt, const jsi::Value &eventHash, const jsi::Value &worklet)
{
  static unsigned long EVENT_HANDLER_ID = 1;

  unsigned long newRegistrationId = EVENT_HANDLER_ID++;
  auto eventName = eventHash.asString(rt).utf8(rt);
  auto handlerShareable = ShareableValue::adapt(rt, worklet, this);

  scheduler->scheduleOnUI([=] {
    auto handlerFunction = handlerShareable->getValue(*runtime).asObject(*runtime).asFunction(*runtime);
    auto handler = std::make_shared<WorkletEventHandler>(newRegistrationId, eventName, std::move(handlerFunction));
    eventHandlerRegistry->registerEventHandler(handler);
  });

  return jsi::Value((double)newRegistrationId);
}

void NativeReanimatedModule::unregisterEventHandler(jsi::Runtime &rt, const jsi::Value &registrationId)
{
  unsigned long id = registrationId.asNumber();
  scheduler->scheduleOnUI([=] {
    eventHandlerRegistry->unregisterEventHandler(id);
  });
}

jsi::Value NativeReanimatedModule::getViewProp(jsi::Runtime &rt, const jsi::Value &viewTag, const jsi::Value &propName, const jsi::Value &callback)
{

  const int viewTagInt = (int)viewTag.asNumber();
  std::string propNameStr = propName.asString(rt).utf8(rt);
  jsi::Function fun = callback.getObject(rt).asFunction(rt);
  std::shared_ptr<jsi::Function> funPtr = std::make_shared<jsi::Function>(std::move(fun));

  scheduler->scheduleOnUI([&rt, viewTagInt, funPtr, this, propNameStr]() {
    const jsi::String propNameValue = jsi::String::createFromUtf8(rt, propNameStr);
    jsi::Value result = propObtainer(rt, viewTagInt, propNameValue);
    std::string resultStr = result.asString(rt).utf8(rt);

    scheduler->scheduleOnJS([&rt, resultStr, funPtr]() {
      const jsi::String resultValue = jsi::String::createFromUtf8(rt, resultStr);
      funPtr->call(rt, resultValue);
    });
  });

  return jsi::Value::undefined();
}

void NativeReanimatedModule::onEvent(std::string eventName, std::string eventAsString)
{
   try
    {
      eventHandlerRegistry->processEvent(*runtime, eventName, eventAsString);
      mapperRegistry->execute(*runtime);
      if (mapperRegistry->needRunOnRender())
      {
        maybeRequestRender();
      }
    }
    catch(std::exception &e) {
     std::string str = e.what();
     this->errorHandler->setError(str);
     this->errorHandler->raise();
   } catch(...) {
     std::string str = "OnEvent error";
     this->errorHandler->setError(str);
     this->errorHandler->raise();
  }
}

bool NativeReanimatedModule::isAnyHandlerWaitingForEvent(std::string eventName) {
  return eventHandlerRegistry->isAnyHandlerWaitingForEvent(eventName);
}


void NativeReanimatedModule::maybeRequestRender()
{
  if (!renderRequested)
  {
    renderRequested = true;
    requestRender([this](double timestampMs) {
      this->renderRequested = false;
      this->onRender(timestampMs);
    }, *this->runtime);
  }
}

void NativeReanimatedModule::onRender(double timestampMs)
{
  try
  {
    std::vector<FrameCallback> callbacks = frameCallbacks;
    frameCallbacks.clear();
    for (auto callback : callbacks)
    {
      callback(timestampMs);
    }
    mapperRegistry->execute(*runtime);

    if (mapperRegistry->needRunOnRender())
    {
      maybeRequestRender();
    }
  } catch(std::exception &e) {
    std::string str = e.what();
    this->errorHandler->setError(str);
    this->errorHandler->raise();
  } catch(...) {
    std::string str = "OnRender error";
    this->errorHandler->setError(str);
    this->errorHandler->raise();
  }
}

NativeReanimatedModule::~NativeReanimatedModule()
{
  StoreUser::clearStore();
}

} // namespace reanimated
