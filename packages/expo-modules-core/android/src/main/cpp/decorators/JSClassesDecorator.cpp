// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSClassesDecorator.h"

#include "SharedObject.h"
#include "JSDecoratorsBridgingObject.h"
#include "../JavaReferencesCache.h"
#include "../JSIContext.h"
#include "../JavaScriptObject.h"

namespace expo {

void JSClassesDecorator::registerClass(
  jni::alias_ref<jstring> name,
  jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> prototypeDecorator,
  jboolean takesOwner,
  jni::alias_ref<jclass> ownerClass,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  auto constructor = std::make_shared<MethodMetadata>(
    "constructor",
    takesOwner &
    0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );

  ClassEntry classTuple{
    prototypeDecorator->cthis()->bridge(),
    std::move(constructor),
    jni::make_global(ownerClass)
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
    auto &[prototypeDecorators, constructor, ownerClass] = classInfo;

    auto weakConstructor = std::weak_ptr<decltype(constructor)::element_type>(constructor);
    auto klass = SharedObject::createClass(
      runtime,
      name.c_str(),
      [weakConstructor = std::move(weakConstructor)](
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
            return { runtime, thisValue };
          }
          jobject unpackedResult = result.get();
          jclass resultClass = env->GetObjectClass(unpackedResult);
          if (env->IsAssignableFrom(
            resultClass,
            JavaReferencesCache::instance()->getJClass(
              "expo/modules/kotlin/sharedobjects/SharedObject").clazz
          )) {
            JSIContext *jsiContext = getJSIContext(runtime);
            auto jsThisObject = JavaScriptObject::newInstance(
              jsiContext,
              jsiContext->runtimeHolder,
              thisObject
            );
            jsiContext->registerSharedObject(result, jsThisObject);
          }
          return { runtime, thisValue };
        } catch (jni::JniException &jniException) {
          rethrowAsCodedError(runtime, jniException);
        }
      }
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

} // namespace expo
