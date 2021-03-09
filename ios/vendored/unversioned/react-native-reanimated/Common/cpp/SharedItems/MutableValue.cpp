#include "MutableValue.h"
#include "SharedParent.h"
#include "ShareableValue.h"
#include "NativeReanimatedModule.h"

namespace reanimated {

void MutableValue::setValue(jsi::Runtime &rt, const jsi::Value &newValue) {
  std::lock_guard<std::mutex> lock(readWriteMutex);
  value = ShareableValue::adapt(rt, newValue, module);
  
  std::shared_ptr<MutableValue> thiz = shared_from_this();
  auto notifyListeners = [thiz] () {
    for (auto listener : thiz->listeners) {
      listener.second();
    }
  };
  
  if (module->isUIRuntime(rt)) {
    notifyListeners();
  } else {
    module->scheduler->scheduleOnUI([notifyListeners] {
      notifyListeners();
    });
  } 
}

jsi::Value MutableValue::getValue(jsi::Runtime &rt) {
  std::lock_guard<std::mutex> lock(readWriteMutex);
  return value->getValue(rt);
}

void MutableValue::set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &newValue) {
  auto propName = name.utf8(rt);

  if (module->isHostRuntime(rt)) {
    if (propName == "value") {
      auto shareable = ShareableValue::adapt(rt, newValue, module);
      module->scheduler->scheduleOnUI([this, shareable] {
        jsi::Runtime &rt = *this->module->runtime.get();
        auto setterProxy = jsi::Object::createFromHostObject(rt, std::make_shared<MutableValueSetterProxy>(shared_from_this()));
        jsi::Value newValue = shareable->getValue(rt);
        module->valueSetter->getValue(rt)
          .asObject(rt)
          .asFunction(rt)
          .callWithThis(rt, setterProxy, newValue);
      });
    }
    return;
  }

  // UI thread
  if (propName == "value") {
    auto setterProxy = jsi::Object::createFromHostObject(rt, std::make_shared<MutableValueSetterProxy>(shared_from_this()));
    module->valueSetter->getValue(rt)
      .asObject(rt)
      .asFunction(rt)
      .callWithThis(rt, setterProxy, newValue);
  } else if (propName == "_animation") {
    // TODO: assert to allow animation to be set from UI only
    if (animation.expired()) {
      animation = getWeakRef(rt);
    }
    *animation.lock() = jsi::Value(rt, newValue);
  }
}

jsi::Value MutableValue::get(jsi::Runtime &rt, const jsi::PropNameID &name) {
  auto propName = name.utf8(rt);

  if (propName == "value") {
    return getValue(rt);
  }

  if (module->isUIRuntime(rt)) {
    // _value and _animation should be accessed from UI only
    if (propName == "_value") {
      return getValue(rt);
    } else if (propName == "_animation") {
      // TODO: assert to allow animation to be read from UI only
      if (animation.expired()) {
        animation = getWeakRef(rt);
      }
      return jsi::Value(rt, *(animation.lock()));
    }
  }

  return jsi::Value::undefined();
}

std::vector<jsi::PropNameID> MutableValue::getPropertyNames(jsi::Runtime &rt) {
  std::vector<jsi::PropNameID> result;
  result.push_back(jsi::PropNameID::forUtf8(rt, std::string("value")));
  return result;
}

MutableValue::MutableValue(jsi::Runtime &rt, const jsi::Value &initial, NativeReanimatedModule *module, std::shared_ptr<Scheduler> s):
StoreUser(s), module(module), value(ShareableValue::adapt(rt, initial, module)) {
}

unsigned long int MutableValue::addListener(unsigned long id, std::function<void ()> listener) {
  listeners[id] = listener;
  return id;
}

void MutableValue::removeListener(unsigned long listenerId) {
  if (listeners.count(listenerId) > 0) {
    listeners.erase(listenerId);
  }
}


}
