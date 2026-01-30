// Copyright 2024-present 650 Industries. All rights reserved.

#include "SharedRef.h"
#include "Global.h"

namespace expo::SharedRef {

void installBaseClass(jsi::Runtime &runtime) {
  jsi::Function baseClass = SharedObject::getBaseClass(runtime);
  jsi::Function klass = expo::common::createInheritingClass(runtime, "SharedRef", baseClass);

  getCoreObject(runtime).setProperty(runtime, "SharedRef", klass);
}

jsi::Function getBaseClass(jsi::Runtime &runtime) {
  return getCoreObject(runtime).getPropertyAsFunction(runtime, "SharedRef");
}

jsi::Function createClass(jsi::Runtime &runtime, const char *className, common::ClassConstructor constructor) {
  jsi::Function baseSharedObjectClass = getBaseClass(runtime);
  return common::createInheritingClass(runtime, className, baseSharedObjectClass, std::move(constructor));
}

} // namespace expo::SharedRef
