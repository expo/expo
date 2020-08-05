#include "SharedParent.h"
#include "FrozenObject.h"
#include "ShareableValue.h"

namespace reanimated {

FrozenObject::FrozenObject(jsi::Runtime &rt, const jsi::Object &object, NativeReanimatedModule *module) {
  auto propertyNames = object.getPropertyNames(rt);
  for (size_t i = 0, count = propertyNames.size(rt); i < count; i++) {
    auto propertyName = propertyNames.getValueAtIndex(rt, i).asString(rt);
    map[propertyName.utf8(rt)] = ShareableValue::adapt(rt, object.getProperty(rt, propertyName), module);
  }
}

std::shared_ptr<jsi::Object> FrozenObject::shallowClone(jsi::Runtime &rt) {
  std::shared_ptr<jsi::Object> object(new jsi::Object(rt));
  for (auto prop : map) {
    object->setProperty(rt, jsi::String::createFromUtf8(rt, prop.first), prop.second->getValue(rt));
  }
  return object;
}

jsi::Value FrozenObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
  auto propName = name.utf8(rt);
  if (propName == "$$typeof") {
    return jsi::Value(rt, jsi::String::createFromAscii(rt, "object"));
  } else if (propName == "Symbol.toStringTag") {
    return jsi::Value(rt, jsi::String::createFromAscii(rt, "FrozenObject"));
  }
  auto found = map.find(propName);
  return found == map.end() ? jsi::Value::undefined() : found->second->getValue(rt);
}

std::vector<jsi::PropNameID> FrozenObject::getPropertyNames(jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> result;
  for (auto it = map.begin(); it != map.end(); it++) {
    result.push_back(jsi::PropNameID::forUtf8(rt, it->first));
  }
  return result;
}

}
