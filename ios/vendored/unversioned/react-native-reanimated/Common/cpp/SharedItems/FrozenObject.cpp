#include "FrozenObject.h"
#include "SharedParent.h"
#include "ShareableValue.h"
#include "RuntimeManager.h"

namespace reanimated {

FrozenObject::FrozenObject(jsi::Runtime &rt, const jsi::Object &object, RuntimeManager *runtimeManager) {
  auto propertyNames = object.getPropertyNames(rt);
  for (size_t i = 0, count = propertyNames.size(rt); i < count; i++) {
    auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);
    std::string nameStr = propertyName.utf8(rt);
    map[nameStr] = ShareableValue::adapt(rt, object.getProperty(rt, propertyName), runtimeManager);
    this->containsHostFunction |= map[nameStr]->containsHostFunction;
  }
}

jsi::Object FrozenObject::shallowClone(jsi::Runtime &rt) {
  jsi::Object object(rt);
  for (auto prop : map) {
    object.setProperty(rt, jsi::String::createFromUtf8(rt, prop.first), prop.second->getValue(rt));
  }
  return object;
}

}
