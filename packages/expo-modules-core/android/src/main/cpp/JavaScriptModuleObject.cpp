// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"
#include "NativeModule.h"

#include "decorators/JSDecoratorsBridgingObject.h"

namespace expo {

jni::local_ref<jni::HybridClass<JavaScriptModuleObject>::jhybriddata>
JavaScriptModuleObject::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

void JavaScriptModuleObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JavaScriptModuleObject::initHybrid),
                   makeNativeMethod("decorate", JavaScriptModuleObject::decorate)
                 });
}

std::shared_ptr<jsi::Object> JavaScriptModuleObject::getJSIObject(jsi::Runtime &runtime) {
  if (auto object = jsiObject.lock()) {
    return object;
  }

  auto moduleObject = std::make_shared<jsi::Object>(NativeModule::createInstance(runtime));

  for (const auto& decorator : this->decorators) {
    decorator->decorate(runtime, *moduleObject);
  }

  jsiObject = moduleObject;
  return moduleObject;
}

void JavaScriptModuleObject::decorate(jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject) noexcept {
  this->decorators = jsDecoratorsBridgingObject->cthis()->bridge();
}

std::weak_ptr<jsi::Object> JavaScriptModuleObject::getCachedJSIObject() {
  return jsiObject;
}

} // namespace expo
