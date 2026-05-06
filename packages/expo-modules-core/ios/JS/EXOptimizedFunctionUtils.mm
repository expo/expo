// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXOptimizedFunctionUtils.h>

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModuleUtils.h>
#include <react/bridging/CallbackWrapper.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace {

void setInvocationArgument(NSInvocation *invocation, NSUInteger index, char typeEncoding, jsi::Runtime &runtime, const jsi::Value &value) {
  switch (typeEncoding) {
    case 'd':
    case 'f': {
      double doubleValue = value.getNumber();
      [invocation setArgument:&doubleValue atIndex:index];
      break;
    }
    case 'q':
    case 'l':
    case 'i':
    case 's':
    case 'c': {
      long long intValue = (long long)value.getNumber();
      [invocation setArgument:&intValue atIndex:index];
      break;
    }
    case 'B': {
      bool boolValue = value.getBool();
      [invocation setArgument:&boolValue atIndex:index];
      break;
    }
    case '@': {
      NSString *stringValue = [NSString stringWithUTF8String:value.asString(runtime).utf8(runtime).c_str()];
      [invocation setArgument:&stringValue atIndex:index];
      break;
    }
    default:
      throw std::runtime_error(std::string("Unsupported argument type encoding: ") + typeEncoding);
  }
}

jsi::Value getInvocationReturnValue(NSInvocation *invocation, char returnType, jsi::Runtime &runtime) {
  switch (returnType) {
    case 'v':
      return jsi::Value::undefined();
    case 'd':
    case 'f': {
      double returnValue;
      [invocation getReturnValue:&returnValue];
      return jsi::Value(returnValue);
    }
    case 'q':
    case 'l':
    case 'i':
    case 's':
    case 'c': {
      long long returnValue;
      [invocation getReturnValue:&returnValue];
      return jsi::Value((double)returnValue);
    }
    case 'B': {
      bool returnValue;
      [invocation getReturnValue:&returnValue];
      return jsi::Value(returnValue);
    }
    case '@': {
      __unsafe_unretained NSString *returnValue = nil;
      [invocation getReturnValue:&returnValue];
      if (returnValue) {
        return jsi::String::createFromUtf8(runtime, [returnValue UTF8String]);
      }
      return jsi::Value::null();
    }
    default:
      throw std::runtime_error(std::string("Unsupported return type encoding: ") + returnType);
  }
}

id getInvocationReturnValueAsObjC(NSInvocation *invocation, char returnType) {
  switch (returnType) {
    case 'v':
      return nil;
    case 'd':
    case 'f': {
      double ret;
      [invocation getReturnValue:&ret];
      return @(ret);
    }
    case 'q':
    case 'l':
    case 'i':
    case 's':
    case 'c': {
      long long ret;
      [invocation getReturnValue:&ret];
      return @(ret);
    }
    case 'B': {
      bool ret;
      [invocation getReturnValue:&ret];
      return @(ret);
    }
    case '@': {
      __unsafe_unretained NSString *ret = nil;
      [invocation getReturnValue:&ret];
      return ret;
    }
    default:
      return nil;
  }
}

/**
 Parses a method-signature `typeEncoding` string into an `NSMethodSignature` plus
 a per-argument type-encoding string and a return-type character. Throws a JS
 error in the given runtime if the encoding is invalid.
 */
void parseTypeEncoding(NSString *typeEncoding, NSInteger argsCount, jsi::Runtime &runtime, const char *errorContext, NSMethodSignature **outSignature, std::string *outArgTypes, char *outReturnType) {
  NSMethodSignature *signature = [NSMethodSignature signatureWithObjCTypes:[typeEncoding UTF8String]];
  if (!signature) {
    throw jsi::JSError(runtime, std::string(errorContext) + ": " + std::string([typeEncoding UTF8String]));
  }
  std::string argTypes((size_t)argsCount, '\0');
  for (NSInteger i = 0; i < argsCount; i++) {
    argTypes[i] = [signature getArgumentTypeAtIndex:i + 1][0];
  }
  *outSignature = signature;
  *outArgTypes = std::move(argTypes);
  *outReturnType = [signature methodReturnType][0];
}

/**
 Sets each JS argument on the invocation. Throws a JS error when the call site
 passed a different number of arguments than the optimized function declares,
 since the sync path reuses a cached invocation (omitted args would keep stale
 values) and the async path would otherwise leave fresh slots uninitialized.
 */
void setInvocationArguments(NSInvocation *invocation, const std::string &argTypes, jsi::Runtime &runtime, const jsi::Value *args, size_t count) {
  if (count != argTypes.size()) {
    throw jsi::JSError(
      runtime,
      "Received " + std::to_string(count) +
      " arguments, but " + std::to_string(argTypes.size()) +
      " was expected"
    );
  }
  for (size_t i = 0; i < argTypes.size(); i++) {
    setInvocationArgument(invocation, i + 1, argTypes[i], runtime, args[i]);
  }
}

jsi::Value convertNSExceptionToJSError(jsi::Runtime &runtime, NSException *exception) {
  NSString *code = exception.userInfo[@"code"] ?: @"ERR_UNKNOWN";
  NSString *message = exception.userInfo[@"message"] ?: exception.reason ?: @"Unknown error";
  auto jsMessage = jsi::String::createFromUtf8(runtime, [message UTF8String]);
  auto error = runtime.global()
    .getProperty(runtime, "Error")
    .asObject(runtime)
    .asFunction(runtime)
    .callAsConstructor(runtime, {jsi::Value(runtime, jsMessage)});
  auto jsCode = jsi::String::createFromUtf8(runtime, [code UTF8String]);
  error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
  return error;
}

jsi::Value convertObjCToJSI(jsi::Runtime &runtime, id value) {
  if (!value || [value isKindOfClass:[NSNull class]]) {
    return jsi::Value::undefined();
  }
  if ([value isKindOfClass:[NSNumber class]]) {
    NSNumber *number = (NSNumber *)value;
    if (strcmp([number objCType], @encode(BOOL)) == 0) {
      return jsi::Value([number boolValue]);
    }
    return jsi::Value([number doubleValue]);
  }
  if ([value isKindOfClass:[NSString class]]) {
    return jsi::String::createFromUtf8(runtime, [(NSString *)value UTF8String]);
  }
  return jsi::Value::undefined();
}

} // anonymous namespace

@implementation EXOptimizedFunctionUtils

+ (void)createSyncFunction:(NSString *)name
              intoObject:(void *)objectPointer
          runtimePointer:(void *)runtimePointer
            typeEncoding:(NSString *)typeEncoding
               argsCount:(NSInteger)argsCount
                   block:(id)block
{
  auto &runtime = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  auto &object = *reinterpret_cast<jsi::Object *>(objectPointer);

  NSMethodSignature *signature;
  std::string argTypes;
  char returnType;
  parseTypeEncoding(typeEncoding, argsCount, runtime, "Invalid type encoding for optimized function", &signature, &argTypes, &returnType);

  // Pre-create and cache NSInvocation (JS execution is single-threaded).
  NSInvocation *cachedInvocation = [NSInvocation invocationWithMethodSignature:signature];
  [cachedInvocation setTarget:block];

  auto propName = jsi::PropNameID::forUtf8(runtime, [name UTF8String]);
  auto function = jsi::Function::createFromHostFunction(
    runtime, propName, (unsigned int)argsCount,
    [block, cachedInvocation, argTypes, returnType](
      jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {

    @try {
      setInvocationArguments(cachedInvocation, argTypes, runtime, args, count);
      [cachedInvocation invoke];
      return getInvocationReturnValue(cachedInvocation, returnType, runtime);
    } @catch (NSException *exception) {
      throw jsi::JSError(runtime, convertNSExceptionToJSError(runtime, exception));
    }
  });

  // Move the function into the caller's object, replacing its contents.
  // jsi::Function is a subclass of jsi::Object, so move-assigning is valid.
  object = std::move(function);
}

+ (void)createAsyncFunction:(NSString *)name
               intoObject:(void *)objectPointer
           runtimePointer:(void *)runtimePointer
             typeEncoding:(NSString *)typeEncoding
                argsCount:(NSInteger)argsCount
                    block:(id)block
{
  auto &runtime = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  auto &object = *reinterpret_cast<jsi::Object *>(objectPointer);

  NSMethodSignature *signature;
  std::string argTypes;
  char returnType;
  parseTypeEncoding(typeEncoding, argsCount, runtime, "Invalid type encoding for optimized async function", &signature, &argTypes, &returnType);

  // Build a `CallInvoker` from the runtime's scheduler binding so the resolve
  // and reject callbacks are dispatched back onto the JS thread. When no
  // binding is installed (plain runtimes, e.g. unit tests) the invocation runs
  // inline on the calling thread — see the inline branch in the host function.
  std::shared_ptr<react::CallInvoker> callInvoker;
  if (auto binding = react::RuntimeSchedulerBinding::getBinding(runtime)) {
    callInvoker = std::make_shared<react::RuntimeSchedulerCallInvoker>(binding->getRuntimeScheduler());
  }

  auto propName = jsi::PropNameID::forUtf8(runtime, [name UTF8String]);
  auto function = jsi::Function::createFromHostFunction(
    runtime, propName, (unsigned int)argsCount,
    [block, signature, argTypes, returnType, callInvoker](
      jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {

    // Create a fresh NSInvocation per call — async calls can overlap.
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setTarget:block];

    setInvocationArguments(invocation, argTypes, runtime, args, count);
    // Retain arguments so strings survive the cross-thread dispatch.
    [invocation retainArguments];

    if (!callInvoker) {
      // No scheduler binding (plain runtimes, e.g. unit tests). Run the
      // invocation inline so we never escape the JS thread, mirroring the
      // sync host function path.
      auto promiseSetup = [invocation, returnType](jsi::Runtime &rt, std::shared_ptr<react::Promise> promise) {
        @try {
          [invocation invoke];
          id result = getInvocationReturnValueAsObjC(invocation, returnType);
          promise->resolve(convertObjCToJSI(rt, result));
        } @catch (NSException *exception) {
          promise->reject_.call(rt, convertNSExceptionToJSError(rt, exception));
        }
      };
      return react::createPromiseAsJSIValue(runtime, std::move(promiseSetup));
    }

    auto promiseSetup = [invocation, returnType, callInvoker](jsi::Runtime &rt, std::shared_ptr<react::Promise> promise) {
      // Wrap resolve/reject as long-lived, thread-safe weak references.
      // The wrappers funnel calls back onto the JS thread via the call invoker
      // and tear themselves down after the first settlement.
      auto weakResolve = react::CallbackWrapper::createWeak(std::move(promise->resolve_), rt, callInvoker);
      auto weakReject = react::CallbackWrapper::createWeak(std::move(promise->reject_), rt, callInvoker);

      dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        @try {
          [invocation invoke];
          id result = getInvocationReturnValueAsObjC(invocation, returnType);

          auto strongResolve = weakResolve.lock();
          auto strongReject = weakReject.lock();
          if (!strongResolve || !strongReject) {
            return;
          }
          strongResolve->jsInvoker().invokeAsync([weakResolve, weakReject, result](jsi::Runtime &rt) {
            auto resolve = weakResolve.lock();
            auto reject = weakReject.lock();
            if (!resolve || !reject) {
              return;
            }
            resolve->callback().call(rt, convertObjCToJSI(rt, result));
            resolve->destroy();
            reject->destroy();
          });
        } @catch (NSException *exception) {
          auto strongResolve = weakResolve.lock();
          auto strongReject = weakReject.lock();
          if (!strongResolve || !strongReject) {
            return;
          }
          strongReject->jsInvoker().invokeAsync([weakResolve, weakReject, exception](jsi::Runtime &rt) {
            auto resolve = weakResolve.lock();
            auto reject = weakReject.lock();
            if (!resolve || !reject) {
              return;
            }
            reject->callback().call(rt, convertNSExceptionToJSError(rt, exception));
            resolve->destroy();
            reject->destroy();
          });
        }
      });
    };

    return react::createPromiseAsJSIValue(runtime, std::move(promiseSetup));
  });

  object = std::move(function);
}

@end
