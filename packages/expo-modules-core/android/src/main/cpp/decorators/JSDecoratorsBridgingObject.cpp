// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JSDecoratorsBridgingObject.h"

#include "JSClassesDecorator.h"

namespace expo {

jni::local_ref<jni::HybridClass<JSDecoratorsBridgingObject>::jhybriddata>
JSDecoratorsBridgingObject::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance();
}

void JSDecoratorsBridgingObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", JSDecoratorsBridgingObject::initHybrid),
                   makeNativeMethod("registerConstants",
                                    JSDecoratorsBridgingObject::registerConstants),
                   makeNativeMethod("registerSyncFunction",
                                    JSDecoratorsBridgingObject::registerSyncFunction),
                   makeNativeMethod("registerAsyncFunction",
                                    JSDecoratorsBridgingObject::registerAsyncFunction),
                   makeNativeMethod("registerProperty",
                                    JSDecoratorsBridgingObject::registerProperty),
                   makeNativeMethod("registerConstant",
                                    JSDecoratorsBridgingObject::registerConstant),
                   makeNativeMethod("registerObject",
                                    JSDecoratorsBridgingObject::registerObject),
                   makeNativeMethod("registerClass",
                                    JSDecoratorsBridgingObject::registerClass)
                 });
}

void JSDecoratorsBridgingObject::registerSyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jboolean enumerable,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  if (!functionDecorator) {
    functionDecorator = std::make_unique<JSFunctionsDecorator>();
  }

  functionDecorator->registerSyncFunction(name, takesOwner, enumerable, expectedArgTypes, body);
}

void JSDecoratorsBridgingObject::registerAsyncFunction(
  jni::alias_ref<jstring> name,
  jboolean takesOwner,
  jboolean enumerable,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIAsyncFunctionBody::javaobject> body
) {
  if (!functionDecorator) {
    functionDecorator = std::make_unique<JSFunctionsDecorator>();
  }

  functionDecorator->registerAsyncFunction(name, takesOwner, enumerable, expectedArgTypes, body);
}

void JSDecoratorsBridgingObject::registerProperty(
  jni::alias_ref<jstring> name,
  jboolean getterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> getterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> getter,
  jboolean setterTakesOwner,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> setterExpectedArgsTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> setter
) {
  if (!propertiesDecorator) {
    propertiesDecorator = std::make_unique<JSPropertiesDecorator>();
  }

  propertiesDecorator->registerProperty(
    name,
    getterTakesOwner,
    getterExpectedArgsTypes,
    getter,
    setterTakesOwner,
    setterExpectedArgsTypes,
    setter
  );
}

void JSDecoratorsBridgingObject::registerConstant(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JNINoArgsFunctionBody::javaobject> getter
) {
  if (!constantsDecorator) {
    constantsDecorator = std::make_unique<JSConstantsDecorator>();
  }

  constantsDecorator->registerConstant(name, getter);
}

void JSDecoratorsBridgingObject::registerConstants(jni::alias_ref<react::NativeMap::javaobject> constants) {
  if (!constantsDecorator) {
    constantsDecorator = std::make_unique<JSConstantsDecorator>();
  }

  constantsDecorator->registerConstants(constants);
}

void JSDecoratorsBridgingObject::registerObject(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject
) {
  if (!objectDecorator) {
    objectDecorator = std::make_unique<JSObjectDecorator>();
  }

  objectDecorator->registerObject(name, jsDecoratorsBridgingObject);
}

void JSDecoratorsBridgingObject::registerClass(
  jni::alias_ref<jstring> name,
  jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsBridgingObject,
  jboolean takesOwner,
  jni::alias_ref<jclass> ownerClass,
  jboolean isSharedRef,
  jni::alias_ref<jni::JArrayClass<ExpectedType>> expectedArgTypes,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  if (!classDecorator) {
    classDecorator = std::make_unique<JSClassesDecorator>();
  }

  classDecorator->registerClass(
    name,
    jsDecoratorsBridgingObject,
    takesOwner,
    ownerClass,
    isSharedRef,
    expectedArgTypes,
    body
  );
}

std::vector<std::unique_ptr<JSDecorator>> JSDecoratorsBridgingObject::bridge() {
  std::vector<std::unique_ptr<JSDecorator>> decorators;

  if (functionDecorator) {
    decorators.push_back(std::move(functionDecorator));
  }

  if (propertiesDecorator) {
    decorators.push_back(std::move(propertiesDecorator));
  }

  if (constantsDecorator) {
    decorators.push_back(std::move(constantsDecorator));
  }

  if (objectDecorator) {
    decorators.push_back(std::move(objectDecorator));
  }

  if (classDecorator) {
    decorators.push_back(std::move(classDecorator));
  }

  return decorators;
}

} // namespace expo
