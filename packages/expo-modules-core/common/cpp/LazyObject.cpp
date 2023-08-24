// Copyright 2022-present 650 Industries. All rights reserved.

#include "JSIUtils.h"
#include "LazyObject.h"

namespace expo {

LazyObject::LazyObject(const LazyObjectInitializer initializer) : initializer(initializer) {}

LazyObject::~LazyObject() {
  backedObject = nullptr;
}

jsi::Value LazyObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  if (!backedObject) {
    if (name.utf8(runtime) == "$$typeof") {
      // React Native asks for this property for some reason, we can just ignore it.
      return jsi::Value::undefined();
    }
    backedObject = initializer(runtime);
  }
  return backedObject ? backedObject->getProperty(runtime, name) : jsi::Value::undefined();
}

void LazyObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name, const jsi::Value &value) {
  if (!backedObject) {
    backedObject = initializer(runtime);
  }
  if (backedObject) {
    backedObject->setProperty(runtime, name, value);
  }
}

std::vector<jsi::PropNameID> LazyObject::getPropertyNames(jsi::Runtime &runtime) {
  if (!backedObject) {
    backedObject = initializer(runtime);
  }
  if (backedObject) {
    jsi::Array propertyNames = backedObject->getPropertyNames(runtime);
    return common::jsiArrayToPropNameIdsVector(runtime, propertyNames);
  }
  return {};
}

} // namespace expo
