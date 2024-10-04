// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSConstantsDecorator.h"

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>

namespace jsi = facebook::jsi;

namespace expo {

void JSConstantsDecorator::registerConstants(
  jni::alias_ref<react::NativeMap::javaobject> constants
) {
  auto dynamic = constants->cthis()->consume();
  assert(dynamic.isObject());

  for (const auto &[key, value]: dynamic.items()) {
    this->constants[key.asString()] = value;
  }
}

void JSConstantsDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (const auto &[name, value]: this->constants) {
    jsObject.setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::valueFromDynamic(runtime, value)
    );
  }
}

} // namespace expo
