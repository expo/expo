// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSClassesDecorator.h"

#include "SharedObject.h"
#include "SharedRef.h"
#include "JSDecoratorsBridgingObject.h"
#include "../JavaReferencesCache.h"
#include "../JSIContext.h"
#include "../JavaScriptObject.h"
#include "JSFunctionsDecorator.h"

namespace expo {

void JSClassesDecorator::registerClass(
  jni::alias_ref<jstring> name,
  jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> prototypeDecorator,
  jboolean takesOwner,
  jni::alias_ref<jclass> ownerClass,
  jboolean isSharedRef,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  MethodMetadata::Info info{
    .name = "constructor",
    // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    .takesOwner = static_cast<bool>(takesOwner & 0x1),
    .isAsync = false,
    .enumerable = false,
    .argTypes = JSFunctionsDecorator::mapConverters(expectedArgTypes)
  };
  auto constructor = std::make_shared<MethodMetadata>(
    std::move(info),
    jni::make_global(body)
  );

  ClassEntry classTuple{
    .prototypeDecorators = prototypeDecorator->cthis()->bridge(),
    .constructor = std::move(constructor),
    .ownerClass = jni::make_global(ownerClass),
    // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    .isSharedRef = static_cast<bool>(isSharedRef & 0x1)
  };

  classes.try_emplace(
    cName,
    std::move(classTuple)
  );
}

void JSClassesDecorator::decorate(
  jsi::Runtime &runtime,
  jsi::Object &jsObject
) {
  for (auto &[name, classInfo]: classes) {
    auto &[prototypeDecorators, constructor, ownerClass, isSharedRef] = classInfo;

    auto weakConstructor = std::weak_ptr<decltype(constructor)::element_type>(constructor);
    expo::common::ClassConstructor jsConstructor = [weakConstructor = std::move(weakConstructor)](
      jsi::Runtime &runtime,
      const jsi::Value &thisValue,
      const jsi::Value *args,
      size_t count
    ) -> jsi::Value {
      // We need to check if the constructor is still alive.
      // If not we can just ignore the call. We're destroying the module.
      auto ctr = weakConstructor.lock();
      if (ctr == nullptr) {
        return jsi::Value::undefined();
      }

      auto thisObject = std::make_shared<jsi::Object>(thisValue.asObject(runtime));

      try {
        JNIEnv *env = jni::Environment::current();
        /**
        * This will push a new JNI stack frame for the LocalReferences in this
        * function call. When the stack frame for this lambda is popped,
        * all LocalReferences are deleted.
        */
        jni::JniLocalScope scope(env, (int) count);
        auto result = ctr->callJNISync(
          env,
          runtime,
          thisValue,
          args,
          count
        );
        if (result == nullptr) {
          return {runtime, thisValue};
        }
        jobject unpackedResult = result.get();
        jclass resultClass = env->GetObjectClass(unpackedResult);
        if (env->IsAssignableFrom(
          resultClass,
          JCacheHolder::get().jSharedObject
        )) {
          JSIContext *jsiContext = getJSIContext(runtime);
          auto jsThisObject = JavaScriptObject::newInstance(
            jsiContext,
            jsiContext->runtimeHolder,
            thisObject
          );
          jsiContext->registerSharedObject(result, jsThisObject);
        }
        return {runtime, thisValue};
      } catch (jni::JniException &jniException) {
        rethrowAsCodedError(runtime, jniException);
      }
    };

    auto klass = createClass(
      runtime,
      name,
      isSharedRef,
      std::move(jsConstructor)
    );
    auto klassSharedPtr = std::make_shared<jsi::Function>(std::move(klass));

    JSIContext *jsiContext = getJSIContext(runtime);

    auto jsThisObject = JavaScriptObject::newInstance(
      jsiContext,
      jsiContext->runtimeHolder,
      klassSharedPtr
    );

    if (ownerClass != nullptr) {
      jsiContext->registerClass(jni::make_local(ownerClass), jsThisObject);
    }

    jsObject.setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *klassSharedPtr)
    );

    jsi::PropNameID prototypePropNameId = jsi::PropNameID::forAscii(runtime, "prototype", 9);
    jsi::Object klassPrototype = klassSharedPtr
      ->getProperty(runtime, prototypePropNameId)
      .asObject(runtime);

    for (const auto &decorator: prototypeDecorators) {
      decorator->decorate(runtime, klassPrototype);
    }
  }
}

jsi::Function JSClassesDecorator::createClass(
  jsi::Runtime &runtime,
  const std::string &className,
  bool isSharedRef,
  common::ClassConstructor constructor
) {
  if (!isSharedRef) {
    return SharedObject::createClass(
      runtime,
      className.c_str(),
      std::move(constructor)
    );
  }

  return SharedRef::createClass(
    runtime,
    className.c_str(),
    std::move(constructor)
  );
}

} // namespace expo
