// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSConstantsDecorator.h"
#include "../JavaScriptObject.h"
#include "JSIUtils.h"
#include "JSFunctionsDecorator.h"
#include "../JSIContext.h"
#include "../types/JNIToJSIConverter.h"

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
    this->legacyConstants[key.asString()] = value;
  }
}

void JSConstantsDecorator::registerConstant(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JNINoArgsFunctionBody::javaobject> getter
) {
  auto cName = name->toStdString();
  constants.insert_or_assign(cName, jni::make_global(getter));
}

void JSConstantsDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (const auto &[name, value]: this->legacyConstants) {
    jsObject.setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::valueFromDynamic(runtime, value)
    );
  }

  for (auto &[name, getter]: this->constants) {
    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime,
                                                                  1 << 1 /* enumerable */);
    jsi::Function jsiFunc = jsi::Function::createFromHostFunction(
      runtime,
      getJSIContext(runtime)->jsRegistry->getPropNameID(runtime, name),
      0,
      [getterFunc = std::move(getter), prevValue = std::shared_ptr<jsi::Value>()](
        jsi::Runtime &rt,
        const jsi::Value &thisValue,
        const jsi::Value *args,
        size_t count
      ) mutable -> jsi::Value {
        if (prevValue == nullptr) {
          JNIEnv *env = jni::Environment::current();
          auto result = JNINoArgsFunctionBody::invoke(getterFunc.get());
          getterFunc = nullptr;
          prevValue = std::make_shared<jsi::Value>(convert(env, rt, result));
        }
        return {rt, *prevValue};
      });

    descriptor.setProperty(
      runtime,
      "get",
      jsi::Value(runtime, jsiFunc)
    );

    common::defineProperty(runtime, &jsObject, name.c_str(), std::move(descriptor));
  }
  this->constants.clear();
}

} // namespace expo
