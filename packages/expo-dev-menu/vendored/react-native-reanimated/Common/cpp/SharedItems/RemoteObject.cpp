#include "DevMenuRemoteObject.h"
#include <jsi/jsi.h>
#include "DevMenuRuntimeDecorator.h"
#include "DevMenuSharedParent.h"

using namespace facebook;

namespace devmenureanimated {

void RemoteObject::maybeInitializeOnWorkletRuntime(jsi::Runtime &rt) {
  if (initializer.get() != nullptr) {
    backing = getWeakRef(rt);
    *backing.lock() = initializer->shallowClone(rt);
    initializer = nullptr;
  }
}

jsi::Value RemoteObject::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
  if (RuntimeDecorator::isWorkletRuntime(rt)) {
    return backing.lock()->getObject(rt).getProperty(rt, name);
  }
  return jsi::Value::undefined();
}

void RemoteObject::set(
    jsi::Runtime &rt,
    const jsi::PropNameID &name,
    const jsi::Value &value) {
  if (RuntimeDecorator::isWorkletRuntime(rt)) {
    backing.lock()->getObject(rt).setProperty(rt, name, value);
  }
  // TODO: we should throw if trying to update remote from host runtime
}

std::vector<jsi::PropNameID> RemoteObject::getPropertyNames(jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> res;
  auto propertyNames = backing.lock()->getObject(rt).getPropertyNames(rt);
  for (size_t i = 0, size = propertyNames.size(rt); i < size; i++) {
    res.push_back(jsi::PropNameID::forString(
        rt, propertyNames.getValueAtIndex(rt, i).asString(rt)));
  }
  return res;
}

} // namespace devmenureanimated
