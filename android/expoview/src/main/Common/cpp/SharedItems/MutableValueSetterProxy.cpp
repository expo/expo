#include "MutableValueSetterProxy.h"
#include "SharedParent.h"
#include "MutableValue.h"
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

void MutableValueSetterProxy::set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &newValue) {
  auto propName = name.utf8(rt);
  if (propName == "value") {
    // you call `this.value` inside of value setter, we should throw
  } else if (propName == "_value") {
    mutableValue->setValue(rt, newValue);
  } else if (propName == "_animation") {
    // TODO: assert to allow animation to be set from UI only
    if (mutableValue->animation.expired()) {
      mutableValue->animation = mutableValue->getWeakRef(rt);
    }
    *mutableValue->animation.lock() = jsi::Value(rt, newValue);
  }
}

jsi::Value MutableValueSetterProxy::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
  auto propName = name.utf8(rt);

  if (propName == "value") {
    return mutableValue->getValue(rt);
  } else if (propName == "_value") {
    return mutableValue->getValue(rt);
  } else if (propName == "_animation") {
    if (mutableValue->animation.expired()) {
      mutableValue->animation = mutableValue->getWeakRef(rt);
    }
    return jsi::Value(rt, *mutableValue->animation.lock());
  }

  return jsi::Value::undefined();
}

}

