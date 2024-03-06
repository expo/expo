// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"
#include "JSIInteropModuleRegistry.h"
#include "JSIUtils.h"
#include "SharedObject.h"

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <react/jni/ReadableNativeArray.h>
#include <fbjni/detail/Hybrid.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <jni/JCallback.h>
#include <jsi/JSIDynamic.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <utility>
#include <tuple>
#include <algorithm>
#include <sstream>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

void decorateObjectWithFunctions(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData) {
  for (auto &[name, method]: objectData->methodsMetadata) {
    jsObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *method.toJSFunction(runtime, jsiInteropModuleRegistry))
    );
  }
}

void decorateObjectWithProperties(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData) {
  for (auto &[name, property]: objectData->properties) {
    auto &[getter, setter] = property;

    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime,
                                                                  1 << 1 /* enumerable */);
    descriptor.setProperty(
      runtime,
      "get",
      jsi::Value(runtime, *getter.toJSFunction(runtime,
                                               jsiInteropModuleRegistry))
    );
    descriptor.setProperty(
      runtime,
      "set",
      jsi::Value(runtime, *setter.toJSFunction(runtime,
                                               jsiInteropModuleRegistry))
    );
    common::defineProperty(runtime, jsObject, name.c_str(), std::move(descriptor));
  }
}

void decorateObjectWithConstants(
  jsi::Runtime &runtime,
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData) {
  for (const auto &[name, value]: objectData->constants) {
    jsObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::valueFromDynamic(runtime, value)
    );
  }
}

jni::local_ref<jni::HybridClass<JavaScriptModuleObject>::jhybriddata>
JavaScriptModuleObject::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void JavaScriptModuleObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JavaScriptModuleObject::initHybrid),
                   makeNativeMethod("exportConstants", JavaScriptModuleObject::exportConstants),
                   makeNativeMethod("registerSyncFunction",
                                    JavaScriptModuleObject::registerSyncFunction),
                   makeNativeMethod("registerAsyncFunction",
                                    JavaScriptModuleObject::registerAsyncFunction),
                   makeNativeMethod("registerProperty",
                                    JavaScriptModuleObject::registerProperty),
                   makeNativeMethod("registerClass",
                                    JavaScriptModuleObject::registerClass),
                   makeNativeMethod("registerViewPrototype",
                                    JavaScriptModuleObject::registerViewPrototype)
                 });
}

std::shared_ptr<jsi::Object> JavaScriptModuleObject::getJSIObject(jsi::Runtime &runtime) {
  if (auto object = jsiObject.lock()) {
    return object;
  }

  auto moduleObject = std::make_shared<jsi::Object>(runtime);

  decorateObjectWithConstants(
    runtime,
    jsiInteropModuleRegistry,
    moduleObject.get(),
    this
  );
  decorateObjectWithProperties(
    runtime,
    jsiInteropModuleRegistry,
    moduleObject.get(),
    this
  );
  decorateObjectWithFunctions(
    runtime,
    jsiInteropModuleRegistry,
    moduleObject.get(),
    this
  );

  if (viewPrototype) {
    auto viewPrototypeObject = viewPrototype->cthis();
    viewPrototypeObject->jsiInteropModuleRegistry = jsiInteropModuleRegistry;
    auto viewPrototypeJSIObject = viewPrototypeObject->getJSIObject(runtime);
    moduleObject->setProperty(
      runtime,
      "ViewPrototype",
      jsi::Value(runtime, *viewPrototypeJSIObject)
    );
  }

  for (auto &[name, classInfo]: classes) {
    auto &[classRef, constructor, ownerClass] = classInfo;
    auto classObject = classRef->cthis();
    classObject->jsiInteropModuleRegistry = jsiInteropModuleRegistry;

    auto klass = SharedObject::createClass(
      runtime,
      name.c_str(),
      [classObject, &constructor = constructor, jsiInteropModuleRegistry = jsiInteropModuleRegistry](
        jsi::Runtime &runtime,
        const jsi::Value &thisValue,
        const jsi::Value *args,
        size_t count
      ) {
        auto thisObject = std::make_shared<jsi::Object>(thisValue.asObject(runtime));
        decorateObjectWithProperties(runtime, jsiInteropModuleRegistry, thisObject.get(),
                                     classObject);
        try {
          JNIEnv *env = jni::Environment::current();
          /**
          * This will push a new JNI stack frame for the LocalReferences in this
          * function call. When the stack frame for this lambda is popped,
          * all LocalReferences are deleted.
          */
          jni::JniLocalScope scope(env, (int) count);
          auto result = constructor.callJNISync(
            env,
            runtime,
            jsiInteropModuleRegistry,
            thisValue,
            args,
            count
          );
          if (result == nullptr) {
            return;
          }
          jobject unpackedResult = result.get();
          jclass resultClass = env->GetObjectClass(unpackedResult);
          if (env->IsAssignableFrom(
            resultClass,
            JavaReferencesCache::instance()->getJClass(
              "expo/modules/kotlin/sharedobjects/SharedObject").clazz
          )) {
            auto jsThisObject = JavaScriptObject::newInstance(
              jsiInteropModuleRegistry,
              jsiInteropModuleRegistry->runtimeHolder,
              thisObject
            );
            jsiInteropModuleRegistry->registerSharedObject(result, jsThisObject);
          }
        } catch (jni::JniException &jniException) {
          rethrowAsCodedError(runtime, jniException);
        }
      }
    );

    auto klassSharedPtr = std::make_shared<jsi::Function>(std::move(klass));

    auto jsThisObject = JavaScriptObject::newInstance(
      jsiInteropModuleRegistry,
      jsiInteropModuleRegistry->runtimeHolder,
      klassSharedPtr
    );

    if (ownerClass != nullptr) {
      jsiInteropModuleRegistry->registerClass(jni::make_local(ownerClass), jsThisObject);
    }

    moduleObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *klassSharedPtr.get())
    );

    jsi::PropNameID prototypePropNameId = jsi::PropNameID::forAscii(runtime, "prototype", 9);
    jsi::Object klassPrototype = klassSharedPtr
      ->getProperty(runtime, prototypePropNameId)
      .asObject(runtime);

    decorateObjectWithFunctions(
      runtime,
      jsiInteropModuleRegistry,
      &klassPrototype,
      classObject
    );
  }

  jsiObject = moduleObject;
  return moduleObject;
}

void JavaScriptModuleObject::exportConstants(
  jni::alias_ref<react::NativeMap::javaobject> constants
) {
  auto dynamic = constants->cthis()->consume();
  assert(dynamic.isObject());

  for (const auto &[key, value]: dynamic.items()) {
    this->constants[key.asString()] = value;
  }
}

void JavaScriptModuleObject::registerSyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();

  methodsMetadata.try_emplace(
    cName,
    cName,
    takesOwner,
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
}

void JavaScriptModuleObject::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();

  methodsMetadata.try_emplace(
    cName,
    cName,
    takesOwner,
    true,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
}

void JavaScriptModuleObject::registerClass(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JavaScriptModuleObject::javaobject> classObject,
  jboolean takesOwner,
  jni::alias_ref<jclass> ownerClass,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  MethodMetadata constructor(
    "constructor",
    takesOwner,
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );

  auto classTuple = std::make_tuple(
    jni::make_global(classObject),
    std::move(constructor),
    jni::make_global(ownerClass)
  );

  classes.try_emplace(
    cName,
    std::move(classTuple)
  );
}

void JavaScriptModuleObject::registerViewPrototype(
  jni::alias_ref<JavaScriptModuleObject::javaobject> viewPrototype
) {
  this->viewPrototype = jni::make_global(viewPrototype);
}

void JavaScriptModuleObject::registerProperty(
  jni::alias_ref<jstring> name,
  jboolean getterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> getter,
  jboolean setterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> setter
) {
  auto cName = name->toStdString();

  auto getterMetadata = MethodMetadata(
    cName,
    getterTakesOwner,
    false,
    jni::make_local(getterExpectedArgsTypes),
    jni::make_global(getter)
  );

  auto setterMetadata = MethodMetadata(
    cName,
    setterTakesOwner,
    false,
    jni::make_local(setterExpectedArgsTypes),
    jni::make_global(setter)
  );

  auto functions = std::make_pair(
    std::move(getterMetadata),
    std::move(setterMetadata)
  );

  properties.insert({cName, std::move(functions)});
}

JavaScriptModuleObject::JavaScriptModuleObject(jni::alias_ref<jhybridobject> jThis)
  : javaPart_(jni::make_global(jThis)) {
}
} // namespace expo
