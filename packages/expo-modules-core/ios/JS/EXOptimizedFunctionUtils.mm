// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXOptimizedFunctionUtils.h>

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

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

  NSMethodSignature *signature = [NSMethodSignature signatureWithObjCTypes:[typeEncoding UTF8String]];
  if (!signature) {
    throw jsi::JSError(runtime, "Invalid type encoding for optimized function: " + std::string([typeEncoding UTF8String]));
  }

  // Pre-create and cache NSInvocation (JS execution is single-threaded)
  NSInvocation *cachedInvocation = [NSInvocation invocationWithMethodSignature:signature];
  [cachedInvocation setTarget:block];

  // Pre-parse argument and return types at registration time
  std::string argTypes(argsCount, '\0');
  for (NSInteger i = 0; i < argsCount; i++) {
    argTypes[i] = [signature getArgumentTypeAtIndex:i + 1][0];
  }
  char returnType = [signature methodReturnType][0];

  auto propName = jsi::PropNameID::forUtf8(runtime, [name UTF8String]);
  auto function = jsi::Function::createFromHostFunction(
    runtime, propName, (unsigned int)argsCount,
    [block, cachedInvocation, argTypes, returnType](
      jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {

    @try {
      for (NSUInteger i = 0; i < count; i++) {
        setInvocationArgument(cachedInvocation, i + 1, argTypes[i], runtime, args[i]);
      }
      [cachedInvocation invoke];
      return getInvocationReturnValue(cachedInvocation, returnType, runtime);
    } @catch (NSException *exception) {
      NSString *code = exception.userInfo[@"code"] ?: @"ERR_UNKNOWN";
      NSString *message = exception.userInfo[@"message"] ?: exception.reason;
      auto jsMessage = jsi::String::createFromUtf8(runtime, [message UTF8String]);
      auto error = runtime.global()
        .getProperty(runtime, "Error")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {jsi::Value(runtime, jsMessage)});
      auto jsCode = jsi::String::createFromUtf8(runtime, [code UTF8String]);
      error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
      throw jsi::JSError(runtime, std::move(error));
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

  NSMethodSignature *signature = [NSMethodSignature signatureWithObjCTypes:[typeEncoding UTF8String]];
  if (!signature) {
    throw jsi::JSError(runtime, "Invalid type encoding for optimized async function: " + std::string([typeEncoding UTF8String]));
  }

  // Pre-parse argument and return types at registration time
  std::string argTypes(argsCount, '\0');
  for (NSInteger i = 0; i < argsCount; i++) {
    argTypes[i] = [signature getArgumentTypeAtIndex:i + 1][0];
  }
  char returnType = [signature methodReturnType][0];

  // Cache the Promise constructor lookup
  auto promiseCtor = std::make_shared<jsi::Object>(
    runtime.global().getProperty(runtime, "Promise").asObject(runtime)
  );

  auto propName = jsi::PropNameID::forUtf8(runtime, [name UTF8String]);
  auto function = jsi::Function::createFromHostFunction(
    runtime, propName, (unsigned int)argsCount,
    [block, signature, argTypes, returnType, promiseCtor](
      jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {

    // Create a fresh NSInvocation per call (async calls can overlap)
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setTarget:block];

    for (NSUInteger i = 0; i < count; i++) {
      setInvocationArgument(invocation, i + 1, argTypes[i], runtime, args[i]);
    }
    [invocation retainArguments];

    // Capture resolve/reject from the Promise executor.
    // The executor runs synchronously inside callAsConstructor,
    // so these are set before we read them below.
    jsi::Function *resolvePtr = nullptr;
    jsi::Function *rejectPtr = nullptr;

    auto executor = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "executor"),
      2,
      [&resolvePtr, &rejectPtr](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) -> jsi::Value {
        resolvePtr = new jsi::Function(args[0].asObject(rt).asFunction(rt));
        rejectPtr = new jsi::Function(args[1].asObject(rt).asFunction(rt));
        return jsi::Value::undefined();
      }
    );

    auto promise = promiseCtor->asFunction(runtime).callAsConstructor(runtime, executor);

    // Move resolve/reject into shared pointers for the background dispatch
    auto resolve = std::shared_ptr<jsi::Function>(resolvePtr);
    auto reject = std::shared_ptr<jsi::Function>(rejectPtr);

    // Capture a pointer to the runtime for scheduling back to JS thread.
    // The runtime outlives async calls dispatched from its own thread.
    jsi::Runtime *runtimePtr = &runtime;

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
      @try {
        [invocation invoke];
        id result = getInvocationReturnValueAsObjC(invocation, returnType);

        dispatch_async(dispatch_get_main_queue(), ^{
          jsi::Value jsResult = convertObjCToJSI(*runtimePtr, result);
          resolve->call(*runtimePtr, jsResult);
        });
      } @catch (NSException *exception) {
        NSString *message = exception.userInfo[@"message"] ?: exception.reason ?: @"Unknown error";
        dispatch_async(dispatch_get_main_queue(), ^{
          auto jsMessage = jsi::String::createFromUtf8(*runtimePtr, [message UTF8String]);
          auto error = runtimePtr->global()
            .getProperty(*runtimePtr, "Error")
            .asObject(*runtimePtr)
            .asFunction(*runtimePtr)
            .callAsConstructor(*runtimePtr, {jsi::Value(*runtimePtr, jsMessage)});
          reject->call(*runtimePtr, std::move(error));
        });
      }
    });

    return promise;
  });

  object = std::move(function);
}

@end
