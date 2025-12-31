// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#import <ExpoModulesJSI/EXJSIUtils.h>
#import <ExpoModulesJSI/EXJSIConversions.h>
#import <ExpoModulesJSI/TestingJSCallInvoker.h>
#import <ExpoModulesJSI/JSIUtils.h>

#import <jsi/jsi.h>
#import <hermes/hermes.h>
#import <ReactCommon/SchedulerPriority.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

#include <unordered_map>
#include <string>

@implementation EXJavaScriptRuntime {
  std::shared_ptr<jsi::Runtime> _runtime;
  std::shared_ptr<react::CallInvoker> _jsCallInvoker;
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}

/**
 Initializes a runtime that is independent from React Native and its runtime initialization.
 This flow is mostly intended for tests.
 */
- (nonnull instancetype)init
{
  if (self = [super init]) {
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
    _runtime = facebook::hermes::makeHermesRuntime();

    // This version of the Hermes uses a Promise implementation that is provided by the RN.
    // The `setImmediate` function isn't defined, but is required by the Promise implementation.
    // That's why we inject it here.
    auto setImmediatePropName = jsi::PropNameID::forUtf8(*_runtime, "setImmediate");
    _runtime->global().setProperty(
      *_runtime, setImmediatePropName, jsi::Function::createFromHostFunction(*_runtime, setImmediatePropName, 1,
        [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
          args[0].asObject(rt).asFunction(rt).call(rt);
          return jsi::Value::undefined();
        })
    );
#else
    _runtime = jsc::makeJSCRuntime();
#endif
    _jsCallInvoker = std::make_shared<expo::TestingJSCallInvoker>(_runtime);
  }
  return self;
}

- (nonnull instancetype)initWithRuntime:(jsi::Runtime &)runtime
{
  if (self = [super init]) {
    // Creating a shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    // In this code flow, the runtime should be owned by something else like the RCTBridge.
    // See explanation for constructor (8): https://en.cppreference.com/w/cpp/memory/shared_ptr/shared_ptr
    _runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), &runtime);
    _runtimeScheduler = expo::runtimeSchedulerFromRuntime(runtime);
    _jsCallInvoker = std::make_shared<RuntimeSchedulerCallInvoker>(_runtimeScheduler);
  }
  return self;
}

- (nonnull jsi::Runtime *)get
{
  return _runtime.get();
}

- (std::shared_ptr<react::CallInvoker>)callInvoker
{
  return _jsCallInvoker;
}

- (nonnull EXJavaScriptObject *)createObject
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(*_runtime);
  return [[EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)createHostObject:(std::shared_ptr<jsi::HostObject>)jsiHostObjectPtr
{
  auto jsObjectPtr = std::make_shared<jsi::Object>(jsi::Object::createFromHostObject(*_runtime, jsiHostObjectPtr));
  return [[EXJavaScriptObject alloc] initWith:jsObjectPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)global
{
  auto jsGlobalPtr = std::make_shared<jsi::Object>(_runtime->global());
  return [[EXJavaScriptObject alloc] initWith:jsGlobalPtr runtime:self];
}

- (nonnull EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSSyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    EXJavaScriptValue * _Nonnull thisValue,
    NSArray<EXJavaScriptValue *> * _Nonnull arguments) {
      NSError *error;
      EXJavaScriptValue *result = block(thisValue, arguments, &error);

      if (error == nil) {
        return [result get];
      } else {
        // `expo::makeCodedError` doesn't work during unit tests, so we construct Error and add a code,
        // instead of using the CodedError subclass.
        jsi::String jsCode = expo::convertNSStringToJSIString(runtime, error.userInfo[@"code"]);
        jsi::String jsMessage = expo::convertNSStringToJSIString(runtime, error.userInfo[@"message"]);
        jsi::Value error = runtime
          .global()
          .getProperty(runtime, "Error")
          .asObject(runtime)
          .asFunction(runtime)
          .callAsConstructor(runtime, {
            jsi::Value(runtime, jsMessage)
          });
        error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
        throw jsi::JSError(runtime, jsi::Value(runtime, error));
      }
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

- (nonnull EXJavaScriptObject *)createSyncFunction:(nonnull NSString *)name
                                      typeEncoding:(nonnull NSString *)typeEncoding
                                         argsCount:(NSInteger)argsCount
                                              body:(nonnull id)swiftBody
{
  // The swiftBody is a Swift closure that we need to wrap in a properly typed ObjC block
  // based on the type encoding. We'll create the typed block here and delegate to the
  // existing createHostFunction:typeEncoding: method.
  return [self createHostFunction:name typeEncoding:typeEncoding argsCount:argsCount block:swiftBody];
}

- (nonnull EXJavaScriptObject *)createAsyncFunction:(nonnull NSString *)name
                                          argsCount:(NSInteger)argsCount
                                              block:(nonnull JSAsyncFunctionBlock)block
{
  JSHostFunctionBlock hostFunctionBlock = ^jsi::Value(
    jsi::Runtime &runtime,
    std::shared_ptr<react::CallInvoker> callInvoker,
    EXJavaScriptValue * _Nonnull thisValue,
    NSArray<EXJavaScriptValue *> * _Nonnull arguments) {
      if (!callInvoker) {
        // In mocked environment the call invoker may be null so it's not supported to call async functions.
        // Testing async functions is a bit more complicated anyway. See `init` description for more.
        throw jsi::JSError(runtime, "Calling async functions is not supported when the call invoker is unavailable");
      }
      // The function that is invoked as a setup of the EXJavaScript `Promise`.
      auto promiseSetup = [callInvoker, block, thisValue, arguments](jsi::Runtime &runtime, std::shared_ptr<Promise> promise) {
        expo::callPromiseSetupWithBlock(runtime, callInvoker, promise, ^(RCTPromiseResolveBlock resolver, RCTPromiseRejectBlock rejecter) {
          block(thisValue, arguments, resolver, rejecter);
        });
      };
      return createPromiseAsJSIValue(runtime, promiseSetup);
    };
  return [self createHostFunction:name argsCount:argsCount block:hostFunctionBlock];
}

#pragma mark - Classes

- (nullable EXJavaScriptObject *)createObjectWithPrototype:(nonnull EXJavaScriptObject *)prototype
{
  std::shared_ptr<jsi::Object> object = std::make_shared<jsi::Object>(expo::common::createObjectWithPrototype(*_runtime, [prototype getShared].get()));
  return object ? [[EXJavaScriptObject alloc] initWith:object runtime:self] : nil;
}

#pragma mark - Script evaluation

- (nonnull EXJavaScriptValue *)evaluateScript:(nonnull NSString *)scriptSource
{
  std::shared_ptr<jsi::StringBuffer> scriptBuffer = std::make_shared<jsi::StringBuffer>([scriptSource UTF8String]);
  jsi::Value result;

  try {
    result = _runtime->evaluateJavaScript(scriptBuffer, "<<evaluated>>");
  } catch (jsi::JSError &error) {
    NSString *reason = [NSString stringWithUTF8String:error.getMessage().c_str()];
    NSString *stack = [NSString stringWithUTF8String:error.getStack().c_str()];

    @throw [NSException exceptionWithName:@"ScriptEvaluationException" reason:reason userInfo:@{
      @"message": reason,
      @"stack": stack,
    }];
  } catch (jsi::JSIException &error) {
    NSString *reason = [NSString stringWithUTF8String:error.what()];

    @throw [NSException exceptionWithName:@"ScriptEvaluationException" reason:reason userInfo:@{
      @"message": reason
    }];
  }
  return [[EXJavaScriptValue alloc] initWithRuntime:self value:std::move(result)];
}

#pragma mark - Runtime execution

- (void)schedule:(nonnull JSRuntimeExecutionBlock)block priority:(int)priority
{
  if (_runtimeScheduler) {
    auto schedulerPriority = static_cast<facebook::react::SchedulerPriority>(priority);
    auto callback = [block](jsi::Runtime &) {
      block();
    };
    _runtimeScheduler->scheduleTask(schedulerPriority, std::move(callback));
    return;
  }
  _jsCallInvoker->invokeAsync(SchedulerPriority(priority), [block = std::move(block)](jsi::Runtime&) {
    block();
  });
}

#pragma mark - Private

- (nonnull EXJavaScriptObject *)createHostFunction:(nonnull NSString *)name
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull JSHostFunctionBlock)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;
  jsi::HostFunctionType function = [weakCallInvoker, block, self](jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    // Theoretically should check here whether the call invoker isn't null, but in mocked environment
    // there is no need to care about that for synchronous calls, so it's ensured in `createAsyncFunction` instead.
    auto callInvoker = weakCallInvoker.lock();
    NSArray<EXJavaScriptValue *> *arguments = expo::convertJSIValuesToNSArray(self, args, count);
    EXJavaScriptValue *thisValue = [[EXJavaScriptValue alloc] initWithRuntime:self value:jsi::Value(runtime, thisVal)];

    return block(runtime, callInvoker, thisValue, arguments);
  };
  std::shared_ptr<jsi::Object> fnPtr = std::make_shared<jsi::Object>(jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function));
  return [[EXJavaScriptObject alloc] initWith:fnPtr runtime:self];
}

namespace {
  // MARK: - Template Specializations for Fast Path

  /// Fast-path template specialization for (Int, Int) -> Int signature
  /// Type encoding: q@?qq
  struct IntIntToIntTrampoline {
    static jsi::Value invoke(id block, jsi::Runtime &runtime, const jsi::Value *args, size_t count) {
      typedef long long(^BlockType)(long long, long long);
      BlockType typedBlock = (BlockType)block;

      long long arg0 = (long long)args[0].getNumber();
      long long arg1 = (long long)args[1].getNumber();
      long long result = typedBlock(arg0, arg1);

      return jsi::Value((double)result);
    }
  };

  /// Fast-path template specialization for (String, String) -> String signature
  /// Type encoding: @@?@@
  struct StringStringToStringTrampoline {
    static jsi::Value invoke(id block, jsi::Runtime &runtime, const jsi::Value *args, size_t count) {
      typedef NSString*(^BlockType)(NSString*, NSString*);
      BlockType typedBlock = (BlockType)block;

      NSString *arg0 = [NSString stringWithUTF8String:args[0].asString(runtime).utf8(runtime).c_str()];
      NSString *arg1 = [NSString stringWithUTF8String:args[1].asString(runtime).utf8(runtime).c_str()];
      NSString *result = typedBlock(arg0, arg1);

      if (result) {
        return jsi::String::createFromUtf8(runtime, [result UTF8String]);
      }
      return jsi::Value::null();
    }
  };

  /// Fast-path template specialization for () -> Void signature
  /// Type encoding: v@?
  struct VoidToVoidTrampoline {
    static jsi::Value invoke(id block, jsi::Runtime &runtime, const jsi::Value *args, size_t count) {
      typedef void(^BlockType)(void);
      BlockType typedBlock = (BlockType)block;

      typedBlock();

      return jsi::Value::undefined();
    }
  };

  /// Fast-path template specialization for (Double, Double) -> Double signature
  /// Type encoding: d@?dd
  struct DoubleDoubleToDoubleTrampoline {
    static jsi::Value invoke(id block, jsi::Runtime &runtime, const jsi::Value *args, size_t count) {
      typedef double(^BlockType)(double, double);
      BlockType typedBlock = (BlockType)block;

      double arg0 = args[0].getNumber();
      double arg1 = args[1].getNumber();
      double result = typedBlock(arg0, arg1);

      return jsi::Value(result);
    }
  };

  // MARK: - Fast Path Detection

  enum class SignatureType {
    IntIntToInt,           // q@?qq
    StringStringToString,  // @@?@@
    VoidToVoid,            // v@?
    DoubleDoubleToDouble,  // d@?dd
    Unknown
  };

  // Static registry mapping type encodings to signature types for O(1) lookup
  static const std::unordered_map<std::string, SignatureType> signatureRegistry = {
    {"q@?qq", SignatureType::IntIntToInt},
    {"@@?@@", SignatureType::StringStringToString},
    {"v@?", SignatureType::VoidToVoid},
    {"d@?dd", SignatureType::DoubleDoubleToDouble},
  };

  SignatureType detectSignatureType(NSString *typeEncoding) {
    std::string encoding([typeEncoding UTF8String]);

    auto it = signatureRegistry.find(encoding);
    if (it != signatureRegistry.end()) {
      return it->second;
    }

    return SignatureType::Unknown;
  }

  jsi::Value invokeFastPath(id block, SignatureType sigType, jsi::Runtime &runtime,
                            const jsi::Value *args, size_t count) {
    switch (sigType) {
      case SignatureType::IntIntToInt:
        return IntIntToIntTrampoline::invoke(block, runtime, args, count);
      case SignatureType::StringStringToString:
        return StringStringToStringTrampoline::invoke(block, runtime, args, count);
      case SignatureType::VoidToVoid:
        return VoidToVoidTrampoline::invoke(block, runtime, args, count);
      case SignatureType::DoubleDoubleToDouble:
        return DoubleDoubleToDoubleTrampoline::invoke(block, runtime, args, count);
      default:
        // Should never reach here
        throw std::runtime_error("Invalid fast path signature");
    }
  }

  // MARK: - NSInvocation Fallback Helpers

  // Helper to set an argument in NSInvocation from a JSI value
  void setInvocationArgument(NSInvocation *invocation, NSUInteger index, const char *typeEncoding, jsi::Runtime &runtime, const jsi::Value &value) {
    switch (typeEncoding[0]) {
      case 'd': // double
      case 'f': { // float
        double doubleValue = value.getNumber();
        [invocation setArgument:&doubleValue atIndex:index];
        break;
      }
      case 'q': // long long
      case 'l': // long
      case 'i': // int
      case 's': // short
      case 'c': { // char
        long long intValue = (long long)value.getNumber();
        [invocation setArgument:&intValue atIndex:index];
        break;
      }
      case 'B': { // bool (C++ style)
        bool boolValue = value.getBool();
        [invocation setArgument:&boolValue atIndex:index];
        break;
      }
      case '@': { // object (NSString*, etc.)
        NSString *stringValue = [NSString stringWithUTF8String:value.asString(runtime).utf8(runtime).c_str()];
        [invocation setArgument:&stringValue atIndex:index];
        break;
      }
      default:
        throw std::runtime_error(std::string("Unsupported argument type: ") + typeEncoding);
    }
  }

  // Helper to get the return value from NSInvocation and convert to JSI
  jsi::Value getInvocationReturnValue(NSInvocation *invocation, const char *returnType, jsi::Runtime &runtime) {
    switch (returnType[0]) {
      case 'v': // void
        return jsi::Value::undefined();
      case 'd': // double
      case 'f': { // float
        double returnValue;
        [invocation getReturnValue:&returnValue];
        return jsi::Value(returnValue);
      }
      case 'q': // long long
      case 'l': // long
      case 'i': // int
      case 's': // short
      case 'c': { // char
        long long returnValue;
        [invocation getReturnValue:&returnValue];
        return jsi::Value((double)returnValue);
      }
      case 'B': { // bool (C++ style)
        bool returnValue;
        [invocation getReturnValue:&returnValue];
        return jsi::Value(returnValue);
      }
      case '@': { // object (NSString*, etc.)
        __unsafe_unretained NSString *returnValue = nil;
        [invocation getReturnValue:&returnValue];
        if (returnValue) {
          return jsi::String::createFromUtf8(runtime, [returnValue UTF8String]);
        }
        return jsi::Value::null();
      }
      default:
        throw std::runtime_error(std::string("Unsupported return type: ") + returnType);
    }
  }
}

- (nonnull EXJavaScriptObject *)createHostFunction:(nonnull NSString *)name
                                      typeEncoding:(nonnull NSString*)typeEncoding
                                         argsCount:(NSInteger)argsCount
                                             block:(nonnull id)block
{
  jsi::PropNameID propNameId = jsi::PropNameID::forAscii(*_runtime, [name UTF8String], [name length]);
  std::weak_ptr<react::CallInvoker> weakCallInvoker = _jsCallInvoker;

  // Detect if this is a known fast-path signature
  SignatureType sigType = detectSignatureType(typeEncoding);

  // Pre-create and cache NSInvocation for slow path (single-threaded JS execution)
  NSInvocation *cachedInvocation = nil;
  NSMethodSignature *cachedSignature = nil;

  if (sigType == SignatureType::Unknown) {
    // Create method signature from type encoding
    cachedSignature = [NSMethodSignature signatureWithObjCTypes:[typeEncoding UTF8String]];
    if (!cachedSignature) {
      @throw [NSException exceptionWithName:@"InvalidTypeEncoding"
                                     reason:[NSString stringWithFormat:@"Invalid type encoding: %@", typeEncoding]
                                   userInfo:nil];
    }

    // Pre-create invocation and set the target block
    cachedInvocation = [NSInvocation invocationWithMethodSignature:cachedSignature];
    [cachedInvocation setTarget:block];
//    [cachedInvocation retainArguments]; // Retain to safely reuse across calls
  }

  jsi::HostFunctionType function = [weakCallInvoker, block, typeEncoding, sigType, cachedInvocation, cachedSignature](
    jsi::Runtime &runtime, const jsi::Value &thisVal, const jsi::Value *args, size_t count) -> jsi::Value {
    auto callInvoker = weakCallInvoker.lock();

    @try {
      // Fast path: Use template specialization for known signatures
      if (sigType != SignatureType::Unknown) {
        return invokeFastPath(block, sigType, runtime, args, count);
      }

      // Slow path: Reuse cached NSInvocation
      // Set arguments (index 0 is the block itself, actual arguments start at index 1)
      for (NSUInteger i = 0; i < count; i++) {
        const char *argType = [cachedSignature getArgumentTypeAtIndex:i + 1];
        setInvocationArgument(cachedInvocation, i + 1, argType, runtime, args[i]);
      }

      // Invoke the block
      [cachedInvocation invoke];

      // Get and convert return value
      const char *returnType = [cachedSignature methodReturnType];
      return getInvocationReturnValue(cachedInvocation, returnType, runtime);

    } @catch (NSException *exception) {
      // Convert NSException from Swift to JSError
      NSString *code = exception.userInfo[@"code"] ?: @"ERR_UNKNOWN";
      NSString *message = exception.userInfo[@"message"] ?: exception.reason;

      jsi::String jsCode = expo::convertNSStringToJSIString(runtime, code);
      jsi::String jsMessage = expo::convertNSStringToJSIString(runtime, message);
      jsi::Value error = runtime
        .global()
        .getProperty(runtime, "Error")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {
          jsi::Value(runtime, jsMessage)
        });
      error.asObject(runtime).setProperty(runtime, "code", jsi::Value(runtime, jsCode));
      throw jsi::JSError(runtime, jsi::Value(runtime, error));
    }
  };

  std::shared_ptr<jsi::Object> fnPtr = std::make_shared<jsi::Object>(jsi::Function::createFromHostFunction(*_runtime, propNameId, (unsigned int)argsCount, function));
  return [[EXJavaScriptObject alloc] initWith:fnPtr runtime:self];
}

@end
