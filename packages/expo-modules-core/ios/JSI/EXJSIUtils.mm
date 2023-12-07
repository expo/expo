// Copyright 2022-present 650 Industries. All rights reserved.

#import <sstream>

#import <React/RCTUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJSIUtils.h>
#import <ExpoModulesCore/JSIUtils.h>

namespace expo {

void callPromiseSetupWithBlock(jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<Promise> promise, PromiseInvocationBlock setupBlock)
{
  auto weakResolveWrapper = react::CallbackWrapper::createWeak(promise->resolve_.getFunction(runtime), runtime, jsInvoker);
  auto weakRejectWrapper = react::CallbackWrapper::createWeak(promise->reject_.getFunction(runtime), runtime, jsInvoker);

  __block BOOL resolveWasCalled = NO;
  __block BOOL rejectWasCalled = NO;

  RCTPromiseResolveBlock resolveBlock = ^(id result) {
    if (rejectWasCalled) {
      throw std::runtime_error("Tried to resolve a promise after it's already been rejected.");
    }

    if (resolveWasCalled) {
      throw std::runtime_error("Tried to resolve a promise more than once.");
    }

    auto strongResolveWrapper = weakResolveWrapper.lock();
    auto strongRejectWrapper = weakRejectWrapper.lock();
    if (!strongResolveWrapper || !strongRejectWrapper) {
      return;
    }

    strongResolveWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, result]() {
      auto strongResolveWrapper2 = weakResolveWrapper.lock();
      auto strongRejectWrapper2 = weakRejectWrapper.lock();
      if (!strongResolveWrapper2 || !strongRejectWrapper2) {
        return;
      }

      jsi::Runtime &rt = strongResolveWrapper2->runtime();
      jsi::Value arg = convertObjCObjectToJSIValue(rt, result);
      strongResolveWrapper2->callback().call(rt, arg);

      strongResolveWrapper2->destroy();
      strongRejectWrapper2->destroy();
    });

    resolveWasCalled = YES;
  };

  RCTPromiseRejectBlock rejectBlock = ^(NSString *code, NSString *message, NSError *error) {
    if (resolveWasCalled) {
      throw std::runtime_error("Tried to reject a promise after it's already been resolved.");
    }

    if (rejectWasCalled) {
      throw std::runtime_error("Tried to reject a promise more than once.");
    }

    auto strongResolveWrapper = weakResolveWrapper.lock();
    auto strongRejectWrapper = weakRejectWrapper.lock();
    if (!strongResolveWrapper || !strongRejectWrapper) {
      return;
    }

    strongRejectWrapper->jsInvoker().invokeAsync([weakResolveWrapper, weakRejectWrapper, code, message]() {
      auto strongResolveWrapper2 = weakResolveWrapper.lock();
      auto strongRejectWrapper2 = weakRejectWrapper.lock();
      if (!strongResolveWrapper2 || !strongRejectWrapper2) {
        return;
      }

      jsi::Runtime &rt = strongRejectWrapper2->runtime();
      jsi::Value jsError = makeCodedError(rt, code, message);

      strongRejectWrapper2->callback().call(rt, jsError);

      strongResolveWrapper2->destroy();
      strongRejectWrapper2->destroy();
    });

    rejectWasCalled = YES;
  };

  setupBlock(resolveBlock, rejectBlock);
}

std::shared_ptr<jsi::Function> createClass(jsi::Runtime &runtime, const char *name, ClassConstructor constructor) {
  std::string nativeConstructorKey("__native_constructor__");

  // Create a string buffer of the source code to evaluate.
  std::stringstream source;
  source << "(function " << name << "(...args) { this." << nativeConstructorKey << "(...args); return this; })";
  std::shared_ptr<jsi::StringBuffer> sourceBuffer = std::make_shared<jsi::StringBuffer>(source.str());

  // Evaluate the code and obtain returned value (the constructor function).
  jsi::Object klass = runtime.evaluateJavaScript(sourceBuffer, "").asObject(runtime);

  // Set the native constructor in the prototype.
  jsi::Object prototype = klass.getPropertyAsObject(runtime, "prototype");
  jsi::PropNameID nativeConstructorPropId = jsi::PropNameID::forAscii(runtime, nativeConstructorKey);
  jsi::Function nativeConstructor = jsi::Function::createFromHostFunction(
    runtime,
    nativeConstructorPropId,
    // The paramCount is not obligatory to match, it only affects the `length` property of the function.
    0,
    [constructor](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args, size_t count) -> jsi::Value {
      constructor(runtime, thisValue, args, count);
      return jsi::Value::undefined();
    });

  jsi::Object descriptor(runtime);
  descriptor.setProperty(runtime, "value", jsi::Value(runtime, nativeConstructor));

  common::definePropertyOnJSIObject(runtime, &prototype, nativeConstructorKey.c_str(), std::move(descriptor));

  return std::make_shared<jsi::Function>(klass.asFunction(runtime));
}

std::shared_ptr<jsi::Object> createObjectWithPrototype(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> prototype) {
  // Get the "Object" class.
  jsi::Object objectClass = runtime
    .global()
    .getPropertyAsObject(runtime, "Object");

  // Call "Object.create(prototype)" to create an object with the given prototype without calling the constructor.
  jsi::Object object = objectClass
    .getPropertyAsFunction(runtime, "create")
    .callWithThis(runtime, objectClass, {
      jsi::Value(runtime, *prototype)
    })
    .asObject(runtime);

  return std::make_shared<jsi::Object>(std::move(object));
}

#pragma mark - Weak objects

bool isWeakRefSupported(jsi::Runtime &runtime) {
  return runtime.global().hasProperty(runtime, "WeakRef");
}

std::shared_ptr<jsi::Object> createWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object) {
  jsi::Object weakRef = runtime
    .global()
    .getProperty(runtime, "WeakRef")
    .asObject(runtime)
    .asFunction(runtime)
    .callAsConstructor(runtime, jsi::Value(runtime, *object))
    .asObject(runtime);
  return std::make_shared<jsi::Object>(std::move(weakRef));
}

std::shared_ptr<jsi::Object> derefWeakRef(jsi::Runtime &runtime, std::shared_ptr<jsi::Object> object) {
  jsi::Value ref = object->getProperty(runtime, "deref")
    .asObject(runtime)
    .asFunction(runtime)
    .callWithThis(runtime, *object);

  if (ref.isUndefined()) {
    return nullptr;
  }
  return std::make_shared<jsi::Object>(ref.asObject(runtime));
}

#pragma mark - Errors

jsi::Value makeCodedError(jsi::Runtime &runtime, NSString *code, NSString *message) {
  jsi::String jsCode = convertNSStringToJSIString(runtime, code);
  jsi::String jsMessage = convertNSStringToJSIString(runtime, message);

  return runtime
    .global()
    .getProperty(runtime, "ExpoModulesCore_CodedError")
    .asObject(runtime)
    .asFunction(runtime)
    .callAsConstructor(runtime, {
      jsi::Value(runtime, jsCode),
      jsi::Value(runtime, jsMessage)
    });
}

} // namespace expo
