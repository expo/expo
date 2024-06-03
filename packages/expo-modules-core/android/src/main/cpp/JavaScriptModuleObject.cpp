// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptModuleObject.h"
#include "JSIContext.h"
#include "JSIUtils.h"
#include "EventEmitter.h"
#include "SharedObject.h"
#include "NativeModule.h"

#include <folly/dynamic.h>
#include <jni.h>
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
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData) {
  for (auto &[name, method]: objectData->methodsMetadata) {
    jsObject->setProperty(
      runtime,
      jsi::String::createFromUtf8(runtime, name),
      jsi::Value(runtime, *method->toJSFunction(runtime))
    );
  }
}

void decorateObjectWithProperties(
  jsi::Runtime &runtime,
  jsi::Object *jsObject,
  JavaScriptModuleObject *objectData) {
  for (auto &[name, property]: objectData->properties) {
    auto &[getter, setter] = property;

    auto descriptor = JavaScriptObject::preparePropertyDescriptor(runtime,
                                                                  1 << 1 /* enumerable */);
    descriptor.setProperty(
      runtime,
      "get",
      jsi::Value(runtime, *getter->toJSFunction(runtime))
    );
    descriptor.setProperty(
      runtime,
      "set",
      jsi::Value(runtime, *setter->toJSFunction(runtime))
    );
    common::defineProperty(runtime, jsObject, name.c_str(), std::move(descriptor));
  }
}

void decorateObjectWithConstants(
  jsi::Runtime &runtime,
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
  return makeCxxInstance();
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
                                    JavaScriptModuleObject::registerViewPrototype),
                   makeNativeMethod("emitEvent",
                                    JavaScriptModuleObject::emitEvent)
                 });
}

std::shared_ptr<jsi::Object> JavaScriptModuleObject::getJSIObject(jsi::Runtime &runtime) {
  if (auto object = jsiObject.lock()) {
    return object;
  }

  auto moduleObject = std::make_shared<jsi::Object>(NativeModule::createInstance(runtime));

  decorate(runtime, moduleObject.get());

  jsiObject = moduleObject;
  return moduleObject;
}

void JavaScriptModuleObject::decorate(jsi::Runtime &runtime, jsi::Object *moduleObject) {
  decorateObjectWithConstants(
    runtime,
    moduleObject,
    this
  );
  decorateObjectWithProperties(
    runtime,
    moduleObject,
    this
  );
  decorateObjectWithFunctions(
    runtime,
    moduleObject,
    this
  );

  if (viewPrototype) {
    auto viewPrototypeObject = viewPrototype->cthis();
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
    auto weakConstructor = std::weak_ptr<decltype(constructor)::element_type>(constructor);
    auto klass = SharedObject::createClass(
      runtime,
      name.c_str(),
      [classObject, weakConstructor = std::move(weakConstructor)](
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
        decorateObjectWithProperties(runtime, thisObject.get(),
                                     classObject);
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
            return jsi::Value(runtime, thisValue);
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
          return jsi::Value(runtime, thisValue);
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
      &klassPrototype,
      classObject
    );
  }
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
  auto methodMetadata = std::make_shared<MethodMetadata>(
    cName,
    takesOwner & 0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
  methodsMetadata.insert_or_assign(cName, std::move(methodMetadata));
}

void JavaScriptModuleObject::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  std::string cName = name->toStdString();
  auto methodMetadata = std::make_shared<MethodMetadata>(
    cName,
    takesOwner & 0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    true,
    jni::make_local(expectedArgTypes),
    jni::make_global(body)
  );
  methodsMetadata.insert_or_assign(cName, std::move(methodMetadata));
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
  auto constructor = std::make_shared<MethodMetadata>(
    "constructor",
    takesOwner & 0x1, // We're unsure if takesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
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

  auto getterMetadata = make_shared<MethodMetadata>(
    cName,
    getterTakesOwner & 0x1, // We're unsure if getterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(getterExpectedArgsTypes),
    jni::make_global(getter)
  );

  auto setterMetadata = make_shared<MethodMetadata>(
    cName,
    setterTakesOwner & 0x1, // We're unsure if setterTakesOwner can be greater than 1, so we're using bitwise AND to ensure it's 0 or 1.
    false,
    jni::make_local(setterExpectedArgsTypes),
    jni::make_global(setter)
  );

  auto functions = std::make_pair(
    std::move(getterMetadata),
    std::move(setterMetadata)
  );

  properties.insert_or_assign(cName, std::move(functions));
}

void JavaScriptModuleObject::emitEvent(
  jni::alias_ref<jni::HybridClass<JSIContext>::javaobject> jsiContextRef,
  jni::alias_ref<jstring> eventName,
  jni::alias_ref<react::ReadableNativeMap::javaobject> eventBody
) {
  const std::string name = eventName->toStdString();
  folly::dynamic body;
  if (eventBody) {
    body = eventBody->cthis()->consume();
  }

  const JSIContext *jsiContext = jsiContextRef->cthis();

  jsiContext->runtimeHolder->jsInvoker->invokeAsync([
    jsiContext,
    name = std::move(name),
    body = std::move(body),
    weakThis = jsiObject
  ]() {
    std::shared_ptr<jsi::Object> jsThis = weakThis.lock();
    if (!jsThis) {
      return;
    }

    // TODO(@lukmccall): refactor when jsInvoker recieves a runtime as a parameter
    jsi::Runtime &rt  = jsiContext->runtimeHolder->get();

    jsi::Value convertedBody = jsi::valueFromDynamic(rt, body);
    std::vector<jsi::Value> args;
    args.emplace_back(std::move(convertedBody));

    EventEmitter::emitEvent(rt, *jsThis, name, args);
  });
}
} // namespace expo
