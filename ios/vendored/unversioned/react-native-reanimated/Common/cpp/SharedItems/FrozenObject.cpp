#include "FrozenObject.h"
#include "RuntimeManager.h"
#include "ShareableValue.h"
#include "SharedParent.h"

namespace reanimated {

FrozenObject::FrozenObject(
    jsi::Runtime &rt,
    const jsi::Object &object,
    RuntimeManager *runtimeManager) {
  auto propertyNames = object.getPropertyNames(rt);
  const size_t count = propertyNames.size(rt);
  namesOrder.reserve(count);
  for (size_t i = 0; i < count; i++) {
    auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);
    namesOrder.push_back(propertyName.utf8(rt));
    std::string nameStr = propertyName.utf8(rt);
    map[nameStr] = ShareableValue::adapt(
        rt, object.getProperty(rt, propertyName), runtimeManager);
    this->containsHostFunction |= map[nameStr]->containsHostFunction;
  }
}

jsi::Object FrozenObject::shallowClone(jsi::Runtime &rt) {
  jsi::Object object(rt);
  for (auto propName : namesOrder) {
    auto value = map[propName];
    object.setProperty(
        rt, jsi::String::createFromUtf8(rt, propName), value->getValue(rt));
  }
  return object;
}

} // namespace reanimated
