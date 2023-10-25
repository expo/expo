#include "WorkletRuntime.h"
#include "JSISerializer.h"
#include "Logger.h"
#include "ReanimatedRuntime.h"
#include "WorkletRuntimeCollector.h"
#include "WorkletRuntimeDecorator.h"

namespace reanimated {

WorkletRuntime::WorkletRuntime(
    jsi::Runtime &rnRuntime,
    const std::shared_ptr<MessageQueueThread> &jsQueue,
    const std::shared_ptr<JSScheduler> &jsScheduler,
    const std::string &name)
    : runtime_(ReanimatedRuntime::make(rnRuntime, jsQueue, name)), name_(name) {
  jsi::Runtime &rt = *runtime_;
  WorkletRuntimeCollector::install(rt);
  WorkletRuntimeDecorator::decorate(rt, name, jsScheduler);
}

void WorkletRuntime::installValueUnpacker(
    const std::string &valueUnpackerCode) {
  jsi::Runtime &rt = *runtime_;
  auto codeBuffer = std::make_shared<const jsi::StringBuffer>(
      "(" + valueUnpackerCode + "\n)");
  auto valueUnpacker = rt.evaluateJavaScript(codeBuffer, "installValueUnpacker")
                           .asObject(rt)
                           .asFunction(rt);
  rt.global().setProperty(rt, "__valueUnpacker", valueUnpacker);
}

jsi::Value WorkletRuntime::get(
    jsi::Runtime &rt,
    const jsi::PropNameID &propName) {
  auto name = propName.utf8(rt);
  if (name == "toString") {
    return jsi::Function::createFromHostFunction(
        rt,
        propName,
        0,
        [this](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *, size_t)
            -> jsi::Value {
          return jsi::String::createFromUtf8(rt, toString());
        });
  }
  if (name == "name") {
    return jsi::String::createFromUtf8(rt, name_);
  }
  return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> WorkletRuntime::getPropertyNames(
    jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, "toString"));
  result.push_back(jsi::PropNameID::forUtf8(rt, "name"));
  return result;
}

std::shared_ptr<WorkletRuntime> extractWorkletRuntime(
    jsi::Runtime &rt,
    const jsi::Value &value) {
  return value.getObject(rt).getHostObject<WorkletRuntime>(rt);
}

} // namespace reanimated
