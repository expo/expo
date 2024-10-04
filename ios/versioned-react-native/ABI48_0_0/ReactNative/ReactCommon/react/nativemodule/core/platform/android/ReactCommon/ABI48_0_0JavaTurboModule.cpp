/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <sstream>
#include <string>

#include <fbjni/fbjni.h>
#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

#include <ABI48_0_0ReactCommon/ABI48_0_0TurboModule.h>
#include <ABI48_0_0ReactCommon/ABI48_0_0TurboModulePerfLogger.h>
#include <ABI48_0_0ReactCommon/ABI48_0_0TurboModuleUtils.h>
#include <ABI48_0_0jsi/ABI48_0_0JSIDynamic.h>
#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0jni/NativeMap.h>
#include <ABI48_0_0React/ABI48_0_0jni/ReadableNativeMap.h>
#include <ABI48_0_0React/ABI48_0_0jni/WritableNativeMap.h>

#include "ABI48_0_0JavaTurboModule.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

namespace TMPL = TurboModulePerfLogger;

JavaTurboModule::JavaTurboModule(const InitParams &params)
    : TurboModule(params.moduleName, params.jsInvoker),
      instance_(jni::make_global(params.instance)),
      nativeInvoker_(params.nativeInvoker),
      retainJSCallback_(params.retainJSCallback) {}

JavaTurboModule::~JavaTurboModule() {
  /**
   * TODO(T75896241): In E2E tests, instance_ is null. Investigate why. Can we
   * get rid of this null check?
   */
  if (!instance_) {
    return;
  }

  nativeInvoker_->invokeAsync([instance = std::move(instance_)]() mutable {
    /**
     * Reset the global NativeModule ref on the NativeModules thread. Why:
     *   - ~JavaTurboModule() can be called on a non-JVM thread. If we reset the
     *     global ref in ~JavaTurboModule(), we might access the JVM from a
     *     non-JVM thread, which will crash the app.
     */
    instance.reset();
  });
}

namespace {

struct JNIArgs {
  JNIArgs(size_t count) : args_(count) {}
  std::vector<jvalue> args_;
  std::vector<jobject> globalRefs_;
};

jni::local_ref<JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
    const JSCallbackRetainer &retainJSCallback,
    jsi::Function &&function,
    jsi::Runtime &rt,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  auto weakWrapper = retainJSCallback != nullptr
      ? retainJSCallback(std::move(function), rt, jsInvoker)
      : ABI48_0_0React::CallbackWrapper::createWeak(std::move(function), rt, jsInvoker);

  // This needs to be a shared_ptr because:
  // 1. It cannot be unique_ptr. std::function is copyable but unique_ptr is
  // not.
  // 2. It cannot be weak_ptr since we need this object to live on.
  // 3. It cannot be a value, because that would be deleted as soon as this
  // function returns.
  auto callbackWrapperOwner =
      std::make_shared<RAIICallbackWrapperDestroyer>(weakWrapper);

  std::function<void(folly::dynamic)> fn =
      [weakWrapper, callbackWrapperOwner, wrapperWasCalled = false](
          folly::dynamic responses) mutable {
        if (wrapperWasCalled) {
          throw std::runtime_error(
              "callback 2 arg cannot be called more than once");
        }

        auto strongWrapper = weakWrapper.lock();
        if (!strongWrapper) {
          return;
        }

        strongWrapper->jsInvoker().invokeAsync(
            [weakWrapper, callbackWrapperOwner, responses]() mutable {
              auto strongWrapper2 = weakWrapper.lock();
              if (!strongWrapper2) {
                return;
              }

              // TODO (T43155926) valueFromDynamic already returns a Value
              // array. Don't iterate again
              jsi::Value args =
                  jsi::valueFromDynamic(strongWrapper2->runtime(), responses);
              auto argsArray = args.getObject(strongWrapper2->runtime())
                                   .asArray(strongWrapper2->runtime());
              std::vector<jsi::Value> result;
              for (size_t i = 0; i < argsArray.size(strongWrapper2->runtime());
                   i++) {
                result.emplace_back(
                    strongWrapper2->runtime(),
                    argsArray.getValueAtIndex(strongWrapper2->runtime(), i));
              }
              strongWrapper2->callback().call(
                  strongWrapper2->runtime(),
                  (const jsi::Value *)result.data(),
                  result.size());

              callbackWrapperOwner.reset();
            });

        wrapperWasCalled = true;
      };

  return JCxxCallbackImpl::newObjectCxxArgs(fn);
}

// This is used for generating short exception strings.
std::string stringifyJSIValue(const jsi::Value &v, jsi::Runtime *rt = nullptr) {
  if (v.isUndefined()) {
    return "undefined";
  }

  if (v.isNull()) {
    return "null";
  }

  if (v.isBool()) {
    return std::string("a boolean (") + (v.getBool() ? "true" : "false") + ")";
  }

  if (v.isNumber()) {
    return "a number (" + std::to_string(v.getNumber()) + ")";
  }

  if (v.isString()) {
    return "a string (\"" + v.getString(*rt).utf8(*rt) + "\")";
  }

  ABI48_0_0React_native_assert(v.isObject() && "Expecting object.");
  return rt != nullptr && v.getObject(*rt).isFunction(*rt) ? "a function"
                                                           : "an object";
}

class JavaTurboModuleArgumentConversionException : public std::runtime_error {
 public:
  JavaTurboModuleArgumentConversionException(
      const std::string &expectedType,
      int index,
      const std::string &methodName,
      const jsi::Value *arg,
      jsi::Runtime *rt)
      : std::runtime_error(
            "Expected argument " + std::to_string(index) + " of method \"" +
            methodName + "\" to be a " + expectedType + ", but got " +
            stringifyJSIValue(*arg, rt)) {}
};

class JavaTurboModuleInvalidArgumentTypeException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentTypeException(
      const std::string &actualType,
      int argIndex,
      const std::string &methodName)
      : std::runtime_error(
            "Called method \"" + methodName + "\" with unsupported type " +
            actualType + " at argument " + std::to_string(argIndex)) {}
};

class JavaTurboModuleInvalidArgumentCountException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentCountException(
      const std::string &methodName,
      int actualArgCount,
      int expectedArgCount)
      : std::runtime_error(
            "TurboModule method \"" + methodName + "\" called with " +
            std::to_string(actualArgCount) +
            " arguments (expected argument count: " +
            std::to_string(expectedArgCount) + ").") {}
};

/**
 * See
 * https://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/types.html
 * for a description of Java method signature structure.
 */
std::vector<std::string> getMethodArgTypesFromSignature(
    const std::string &methodSignature) {
  std::vector<std::string> methodArgs;

  for (auto it = methodSignature.begin(); it != methodSignature.end();
       it += 1) {
    if (*it == '(') {
      continue;
    }

    if (*it == ')') {
      break;
    }

    std::string type;

    if (*it == '[') {
      type += *it;
      it += 1;
    }

    if (*it == 'L') {
      for (; it != methodSignature.end(); it += 1) {
        type += *it;

        if (*it == ';') {
          break;
        }
      }
    } else {
      type += *it;
    }

    methodArgs.push_back(type);
  }

  return methodArgs;
}

int32_t getUniqueId() {
  static int32_t counter = 0;
  return counter++;
}

// fbjni already does this conversion, but since we are using plain JNI, this
// needs to be done again
// TODO (axe) Reuse existing implementation as needed - the exist in
// MethodInvoker.cpp
JNIArgs convertJSIArgsToJNIArgs(
    JNIEnv *env,
    jsi::Runtime &rt,
    const std::string &methodName,
    const std::vector<std::string> &methodArgTypes,
    const jsi::Value *args,
    size_t count,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    TurboModuleMethodValueKind valueKind,
    const JSCallbackRetainer &retainJSCallback) {
  unsigned int expectedArgumentCount = valueKind == PromiseKind
      ? methodArgTypes.size() - 1
      : methodArgTypes.size();

  if (expectedArgumentCount != count) {
    throw JavaTurboModuleInvalidArgumentCountException(
        methodName, count, expectedArgumentCount);
  }

  JNIArgs jniArgs(valueKind == PromiseKind ? count + 1 : count);
  auto &jargs = jniArgs.args_;
  auto &globalRefs = jniArgs.globalRefs_;

  auto makeGlobalIfNecessary =
      [&globalRefs, env, valueKind](jobject obj) -> jobject {
    if (valueKind == VoidKind || valueKind == PromiseKind) {
      jobject globalObj = env->NewGlobalRef(obj);
      globalRefs.push_back(globalObj);
      env->DeleteLocalRef(obj);
      return globalObj;
    }

    return obj;
  };

  for (unsigned int argIndex = 0; argIndex < count; argIndex += 1) {
    const std::string &type = methodArgTypes.at(argIndex);

    const jsi::Value *arg = &args[argIndex];
    jvalue *jarg = &jargs[argIndex];

    if (type == "D") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->d = arg->getNumber();
      continue;
    }

    if (type == "Z") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }
      jarg->z = (jboolean)arg->getBool();
      continue;
    }

    if (arg->isNull() || arg->isUndefined()) {
      jarg->l = nullptr;
    } else if (type == "Ljava/lang/Double;") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JDouble::valueOf(arg->getNumber()).release());
    } else if (type == "Ljava/lang/Boolean;") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JBoolean::valueOf(arg->getBool()).release());
    } else if (type == "Ljava/lang/String;") {
      if (!arg->isString()) {
        throw JavaTurboModuleArgumentConversionException(
            "string", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          env->NewStringUTF(arg->getString(rt).utf8(rt).c_str()));
    } else if (type == "Lcom/facebook/ABI48_0_0React/bridge/Callback;") {
      if (!(arg->isObject() && arg->getObject(rt).isFunction(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Function", argIndex, methodName, arg, &rt);
      }
      jsi::Function fn = arg->getObject(rt).getFunction(rt);
      jarg->l = makeGlobalIfNecessary(
          createJavaCallbackFromJSIFunction(
              retainJSCallback, std::move(fn), rt, jsInvoker)
              .release());
    } else if (type == "Lcom/facebook/ABI48_0_0React/bridge/ReadableArray;") {
      if (!(arg->isObject() && arg->getObject(rt).isArray(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Array", argIndex, methodName, arg, &rt);
      }
      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeArray::newObjectCxxArgs(std::move(dynamicFromValue));
      jarg->l = makeGlobalIfNecessary(jParams.release());
    } else if (type == "Lcom/facebook/ABI48_0_0React/bridge/ReadableMap;") {
      if (!(arg->isObject())) {
        throw JavaTurboModuleArgumentConversionException(
            "Object", argIndex, methodName, arg, &rt);
      }
      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeMap::createWithContents(std::move(dynamicFromValue));
      jarg->l = makeGlobalIfNecessary(jParams.release());
    } else {
      throw JavaTurboModuleInvalidArgumentTypeException(
          type, argIndex, methodName);
    }
  }

  return jniArgs;
}

jsi::Value convertFromJMapToValue(JNIEnv *env, jsi::Runtime &rt, jobject arg) {
  // We currently use Java Argument.makeNativeMap() method to do this conversion
  // This could also be done purely in C++, but iterative over map methods
  // but those may end up calling reflection methods anyway
  // TODO (axe) Investigate the best way to convert Java Map to Value
  jclass jArguments = env->FindClass("com/facebook/ABI48_0_0React/bridge/Arguments");
  static jmethodID jMakeNativeMap = env->GetStaticMethodID(
      jArguments,
      "makeNativeMap",
      "(Ljava/util/Map;)Lcom/facebook/ABI48_0_0React/bridge/WritableNativeMap;");
  auto constants =
      (jobject)env->CallStaticObjectMethod(jArguments, jMakeNativeMap, arg);
  auto jResult = jni::adopt_local(constants);
  auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
  return jsi::valueFromDynamic(rt, result->cthis()->consume());
}

} // namespace

jsi::Value JavaTurboModule::invokeJavaMethod(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind valueKind,
    const std::string &methodNameStr,
    const std::string &methodSignature,
    const jsi::Value *args,
    size_t argCount,
    jmethodID &methodID) {
  const char *methodName = methodNameStr.c_str();
  const char *moduleName = name_.c_str();

  bool isMethodSync = !(valueKind == VoidKind || valueKind == PromiseKind);

  if (isMethodSync) {
    TMPL::syncMethodCallStart(moduleName, methodName);
    TMPL::syncMethodCallArgConversionStart(moduleName, methodName);
  } else {
    TMPL::asyncMethodCallStart(moduleName, methodName);
    TMPL::asyncMethodCallArgConversionStart(moduleName, methodName);
  }

  JNIEnv *env = jni::Environment::current();
  auto instance = instance_.get();

  /**
   * To account for jclasses and other misc LocalReferences we create.
   */
  unsigned int buffer = 6;
  /**
   * For promises, we have to create a resolve fn, a reject fn, and a promise
   * object. For normal returns, we just create the return object.
   */
  unsigned int maxReturnObjects = 3;

  /**
   * When the return type is void, all JNI LocalReferences are converted to
   * GlobalReferences. The LocalReferences are then promptly deleted
   * after the conversion.
   */
  unsigned int actualArgCount = valueKind == VoidKind ? 0 : argCount;
  unsigned int estimatedLocalRefCount =
      actualArgCount + maxReturnObjects + buffer;

  /**
   * This will push a new JNI stack frame for the LocalReferences in this
   * function call. When the stack frame for invokeJavaMethod is popped,
   * all LocalReferences are deleted.
   *
   * In total, there can be at most kJniLocalRefMax (= 512) Jni
   * LocalReferences alive at a time. estimatedLocalRefCount is provided
   * so that PushLocalFrame can throw an out of memory error when the total
   * number of alive LocalReferences is estimatedLocalRefCount smaller than
   * kJniLocalRefMax.
   */
  jni::JniLocalScope scope(env, estimatedLocalRefCount);

  auto checkJNIErrorForMethodCall = [&]() -> void {
    try {
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
    } catch (...) {
      if (isMethodSync) {
        TMPL::syncMethodCallFail(moduleName, methodName);
      } else {
        TMPL::asyncMethodCallFail(moduleName, methodName);
      }
      throw;
    }
  };

  if (!methodID) {
    jclass cls = env->GetObjectClass(instance);
    methodID = env->GetMethodID(cls, methodName, methodSignature.c_str());

    // If the method signature doesn't match, show a redbox here instead of
    // crashing later.
    checkJNIErrorForMethodCall();
  }

  // TODO(T43933641): Refactor to remove this special-casing
  if (methodNameStr == "getConstants") {
    TMPL::syncMethodCallArgConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallExecutionStart(moduleName, methodName);

    auto constantsMap = (jobject)env->CallObjectMethod(instance, methodID);
    checkJNIErrorForMethodCall();

    TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
    TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

    jsi::Value returnValue = constantsMap == nullptr
        ? jsi::Value::undefined()
        : convertFromJMapToValue(env, runtime, constantsMap);

    TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallEnd(moduleName, methodName);
    return returnValue;
  }

  std::vector<std::string> methodArgTypes =
      getMethodArgTypesFromSignature(methodSignature);

  JNIArgs jniArgs = convertJSIArgsToJNIArgs(
      env,
      runtime,
      methodNameStr,
      methodArgTypes,
      args,
      argCount,
      jsInvoker_,
      valueKind,
      retainJSCallback_);

  if (isMethodSync && valueKind != PromiseKind) {
    TMPL::syncMethodCallArgConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallExecutionStart(moduleName, methodName);
  }

  auto &jargs = jniArgs.args_;
  auto &globalRefs = jniArgs.globalRefs_;

  switch (valueKind) {
    case BooleanKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Boolean;") {
        auto returnObject =
            env->CallObjectMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        auto returnValue = jsi::Value::null();
        if (returnObject) {
          auto booleanObj = jni::adopt_local(
              static_cast<jni::JBoolean::javaobject>(returnObject));
          returnValue = jsi::Value(static_cast<bool>(booleanObj->value()));
        }

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      } else {
        bool returnBoolean =
            (bool)env->CallBooleanMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        jsi::Value returnValue = jsi::Value(returnBoolean);

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);

        return returnValue;
      }
    }
    case NumberKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Double;") {
        auto returnObject =
            env->CallObjectMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        auto returnValue = jsi::Value::null();
        if (returnObject) {
          auto doubleObj = jni::adopt_local(
              static_cast<jni::JDouble::javaobject>(returnObject));
          returnValue = jsi::Value(doubleObj->value());
        }

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      } else {
        double returnDouble =
            (double)env->CallDoubleMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        jsi::Value returnValue = jsi::Value(returnDouble);

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      }
    }
    case StringKind: {
      auto returnString =
          (jstring)env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnString != nullptr) {
        const char *js = env->GetStringUTFChars(returnString, nullptr);
        std::string result = js;
        env->ReleaseStringUTFChars(returnString, js);
        returnValue =
            jsi::Value(runtime, jsi::String::createFromUtf8(runtime, result));
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case ObjectKind: {
      auto returnObject =
          env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnObject != nullptr) {
        auto jResult = jni::adopt_local(returnObject);
        auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
        returnValue =
            jsi::valueFromDynamic(runtime, result->cthis()->consume());
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case ArrayKind: {
      auto returnObject =
          (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnObject != nullptr) {
        auto jResult = jni::adopt_local(returnObject);
        auto result = jni::static_ref_cast<NativeArray::jhybridobject>(jResult);
        returnValue =
            jsi::valueFromDynamic(runtime, result->cthis()->consume());
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case VoidKind: {
      TMPL::asyncMethodCallArgConversionEnd(moduleName, methodName);
      TMPL::asyncMethodCallDispatch(moduleName, methodName);

      nativeInvoker_->invokeAsync(
          [jargs,
           globalRefs,
           methodID,
           instance_ = jni::make_weak(instance_),
           moduleNameStr = name_,
           methodNameStr,
           id = getUniqueId()]() mutable -> void {
            auto instance = instance_.lockLocal();
            if (!instance) {
              return;
            }
            /**
             * TODO(ramanpreet): Why do we have to require the environment
             * again? Why does JNI crash when we use the env from the upper
             * scope?
             */
            JNIEnv *env = jni::Environment::current();
            const char *moduleName = moduleNameStr.c_str();
            const char *methodName = methodNameStr.c_str();

            TMPL::asyncMethodCallExecutionStart(moduleName, methodName, id);
            env->CallVoidMethodA(instance.get(), methodID, jargs.data());
            try {
              FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
            } catch (...) {
              TMPL::asyncMethodCallExecutionFail(moduleName, methodName, id);
              throw;
            }

            for (auto globalRef : globalRefs) {
              env->DeleteGlobalRef(globalRef);
            }
            TMPL::asyncMethodCallExecutionEnd(moduleName, methodName, id);
          });

      TMPL::asyncMethodCallEnd(moduleName, methodName);
      return jsi::Value::undefined();
    }
    case PromiseKind: {
      jsi::Function Promise =
          runtime.global().getPropertyAsFunction(runtime, "Promise");

      jsi::Function promiseConstructorArg = jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "fn"),
          2,
          [this,
           &jargs,
           &globalRefs,
           argCount,
           methodID,
           moduleNameStr = name_,
           methodNameStr,
           env,
           retainJSCallback = retainJSCallback_](
              jsi::Runtime &runtime,
              const jsi::Value &thisVal,
              const jsi::Value *promiseConstructorArgs,
              size_t promiseConstructorArgCount) {
            if (promiseConstructorArgCount != 2) {
              throw std::invalid_argument("Promise fn arg count must be 2");
            }

            jsi::Function resolveJSIFn =
                promiseConstructorArgs[0].getObject(runtime).getFunction(
                    runtime);
            jsi::Function rejectJSIFn =
                promiseConstructorArgs[1].getObject(runtime).getFunction(
                    runtime);

            auto resolve = createJavaCallbackFromJSIFunction(
                               retainJSCallback,
                               std::move(resolveJSIFn),
                               runtime,
                               jsInvoker_)
                               .release();
            auto reject = createJavaCallbackFromJSIFunction(
                              retainJSCallback,
                              std::move(rejectJSIFn),
                              runtime,
                              jsInvoker_)
                              .release();

            jclass jPromiseImpl =
                env->FindClass("com/facebook/ABI48_0_0React/bridge/PromiseImpl");
            jmethodID jPromiseImplConstructor = env->GetMethodID(
                jPromiseImpl,
                "<init>",
                "(Lcom/facebook/ABI48_0_0React/bridge/Callback;Lcom/facebook/ABI48_0_0React/bridge/Callback;)V");

            jobject promise = env->NewObject(
                jPromiseImpl, jPromiseImplConstructor, resolve, reject);

            const char *moduleName = moduleNameStr.c_str();
            const char *methodName = methodNameStr.c_str();

            jobject globalPromise = env->NewGlobalRef(promise);

            globalRefs.push_back(globalPromise);
            env->DeleteLocalRef(promise);

            jargs[argCount].l = globalPromise;
            TMPL::asyncMethodCallArgConversionEnd(moduleName, methodName);
            TMPL::asyncMethodCallDispatch(moduleName, methodName);

            nativeInvoker_->invokeAsync(
                [jargs,
                 globalRefs,
                 methodID,
                 instance_ = jni::make_weak(instance_),
                 moduleNameStr,
                 methodNameStr,
                 id = getUniqueId()]() mutable -> void {
                  auto instance = instance_.lockLocal();

                  if (!instance) {
                    return;
                  }
                  /**
                   * TODO(ramanpreet): Why do we have to require the
                   * environment again? Why does JNI crash when we use the env
                   * from the upper scope?
                   */
                  JNIEnv *env = jni::Environment::current();
                  const char *moduleName = moduleNameStr.c_str();
                  const char *methodName = methodNameStr.c_str();

                  TMPL::asyncMethodCallExecutionStart(
                      moduleName, methodName, id);
                  env->CallVoidMethodA(instance.get(), methodID, jargs.data());
                  try {
                    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
                  } catch (...) {
                    TMPL::asyncMethodCallExecutionFail(
                        moduleName, methodName, id);
                    throw;
                  }

                  for (auto globalRef : globalRefs) {
                    env->DeleteGlobalRef(globalRef);
                  }
                  TMPL::asyncMethodCallExecutionEnd(moduleName, methodName, id);
                });

            return jsi::Value::undefined();
          });

      jsi::Value promise =
          Promise.callAsConstructor(runtime, promiseConstructorArg);
      checkJNIErrorForMethodCall();

      TMPL::asyncMethodCallEnd(moduleName, methodName);

      return promise;
    }
    default:
      throw std::runtime_error(
          "Unable to find method module: " + methodNameStr + "(" +
          methodSignature + ")");
  }
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
