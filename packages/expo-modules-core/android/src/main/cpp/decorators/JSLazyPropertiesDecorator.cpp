// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSLazyPropertiesDecorator.h"
#include "../JavaScriptObject.h"
#include "JSIUtils.h"
#include "JSFunctionsDecorator.h"
#include "../JSIContext.h"
#include "../types/JNIToJSIConverter.h"

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

void JSLazyPropertiesDecorator::registerLazyProperty(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JNINoArgsFunctionBody::javaobject> getter
) {
  auto cName = name->toStdString();
  lazyProperties.insert_or_assign(cName, jni::make_global(getter));
}

void JSLazyPropertiesDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (auto &[name, getter]: this->lazyProperties) {
    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime,
                                                                  1 << 1 /* enumerable */);
    jsi::Function jsiFunc = jsi::Function::createFromHostFunction(
      runtime,
      getJSIContext(runtime)->jsRegistry->getPropNameID(runtime, name),
      0,
      [getter, prevValue=std::shared_ptr<jsi::Value>()](
        jsi::Runtime &rt,
        const jsi::Value &thisValue,
        const jsi::Value *args,
        size_t count
      ) mutable -> jsi::Value {
        if (prevValue == nullptr) {
          if (getter == nullptr) {
            return nullptr;
          }
          JNIEnv *env = jni::Environment::current();
          auto result = JNINoArgsFunctionBody::invoke(getter.get());
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
}

} // namespace expo
