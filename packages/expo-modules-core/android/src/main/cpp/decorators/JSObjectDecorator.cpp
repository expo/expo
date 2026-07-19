// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSObjectDecorator.h"
#include "JSDecoratorsBridgingObject.h"

namespace expo {

void JSObjectDecorator::registerObject(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject
) {
  auto nameStr = name->toStdString();
  objects.emplace(nameStr, jsDecoratorsBridgingObject->cthis()->bridge());
}

void JSObjectDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (const auto &[name, decorators]: this->objects) {
    auto object = jsi::Object(runtime);
    for (const auto &decorator: decorators) {
      decorator->decorate(runtime, object);
    }

    jsObject.setProperty(
      runtime,
      name.c_str(),
      jsi::Value(runtime, object)
    );
  }
}

} // namespace expo
