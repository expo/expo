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
                                    JSDecoratorsBridgingObject::registerClass),
                   makeNativeMethod("registerOptimizedSyncFunction",
                                    JSDecoratorsBridgingObject::registerOptimizedSyncFunction)
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
  jni::alias_ref<JSDecoratorsBridgingObject::javaobject> jsDecoratorsConstructor,
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
    jsDecoratorsConstructor,
    takesOwner,
    ownerClass,
    isSharedRef,
    expectedArgTypes,
    body
  );
}

void JSDecoratorsBridgingObject::registerOptimizedSyncFunction(
  jni::alias_ref<jstring> name,
  jni::alias_ref<jstring> methodName,
  jni::alias_ref<jobject> moduleInstance,
  jni::alias_ref<jstring> jniSignature,
  jni::alias_ref<jni::JArrayClass<jstring>::javaobject> paramTypes,
  jni::alias_ref<jstring> returnType
) {
  // Create decorator with the module instance if it doesn't exist
  if (!optimizedFunctionDecorator) {
    jni::global_ref<jobject> globalModuleInstance = jni::make_global(moduleInstance);
    optimizedFunctionDecorator = std::make_unique<JSOptimizedFunctionsDecorator>(globalModuleInstance);
  }

  std::string functionName = name->toStdString();
  std::string methodNameStr = methodName->toStdString();
  std::string jniSignatureStr = jniSignature->toStdString();
  std::string returnTypeStr = returnType->toStdString();

  // Convert parameter types from String array to JNIType vector
  std::vector<JNIType> paramTypeVec;
  size_t paramCount = paramTypes->size();
  for (size_t i = 0; i < paramCount; i++) {
    auto paramTypeStr = paramTypes->getElement(i)->toStdString();
    paramTypeVec.push_back(stringToJNIType(paramTypeStr));
  }

  // Convert return type
  JNIType returnJNIType = stringToJNIType(returnTypeStr);

  // Register the function with metadata
  optimizedFunctionDecorator->registerOptimizedFunction(
    functionName,
    methodNameStr,
    jniSignatureStr,
    paramTypeVec,
    returnJNIType,
    paramCount,
    true
  );
}

// Helper function to convert type string to JNIType enum
JNIType JSDecoratorsBridgingObject::stringToJNIType(const std::string& typeStr) {
  if (typeStr == "D") return JNIType::Double;
  if (typeStr == "I") return JNIType::Int;
  if (typeStr == "Z") return JNIType::Boolean;
  if (typeStr == "J") return JNIType::Long;
  if (typeStr == "F") return JNIType::Float;
  if (typeStr == "Ljava/lang/String;") return JNIType::String;
  if (typeStr == "V") return JNIType::Void;
  return JNIType::Object;
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

  if (optimizedFunctionDecorator) {
    decorators.push_back(std::move(optimizedFunctionDecorator));
  }

  return decorators;
}

} // namespace expo
