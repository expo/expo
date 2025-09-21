// Copyright 2018-present 650 Industries. All rights reserved.

#import <react/bridging/CallbackWrapper.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <ExpoModulesCore/EXJavaScriptWeakObject.h>
#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/EXJavaScriptSharedObjectBinding.h>
#import <ExpoModulesCore/EXStringUtils.h>
#import <Foundation/NSURL.h>

namespace expo {

/**
 * All static helper functions are ObjC++ specific.
 */
jsi::Value convertNSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value((bool)[value boolValue]);
}

jsi::Value convertNSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value([value doubleValue]);
}

jsi::String convertNSStringToJSIString(jsi::Runtime &runtime, NSString *value)
{
#if !TARGET_OS_OSX
  const uint8_t *utf8 = (const uint8_t *)[value UTF8String];
  const size_t length = [value length];
  if (expo::isAllASCIIAndNotNull(utf8, utf8 + length)) {
    return jsi::String::createFromAscii(runtime, (const char *)utf8, length);
  }
  // Using cStringUsingEncoding should be fine as long as we provide the length.
  return jsi::String::createFromUtf16(runtime, (const char16_t *)[value cStringUsingEncoding:NSUTF16StringEncoding], length);
#else
  // TODO(@jakex7): Remove after update to react-native-macos@0.79.0
  return jsi::String::createFromUtf8(runtime, [value UTF8String]);
#endif
}

jsi::String convertNSURLToJSIString(jsi::Runtime &runtime, NSURL *value)
{
  NSString *stringValue = [value absoluteString];
  return convertNSStringToJSIString(runtime, stringValue);
}

jsi::Object convertNSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value)
{
  jsi::Object result = jsi::Object(runtime);
  for (NSString *k in value) {
    result.setProperty(runtime, [k UTF8String], convertObjCObjectToJSIValue(runtime, value[k]));
  }
  return result;
}

jsi::Array convertNSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value)
{
  jsi::Array result = jsi::Array(runtime, value.count);
  for (size_t i = 0; i < value.count; i++) {
    result.setValueAtIndex(runtime, i, convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

std::vector<jsi::Value> convertNSArrayToStdVector(jsi::Runtime &runtime, NSArray *value)
{
  std::vector<jsi::Value> result;
  for (size_t i = 0; i < value.count; i++) {
    result.emplace_back(convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

jsi::Value createUint8Array(jsi::Runtime &runtime, NSData *data) {
  auto global = runtime.global();
  auto arrayBufferCtor = global.getPropertyAsFunction(runtime, "ArrayBuffer");
  auto arrayBufferObject = arrayBufferCtor.callAsConstructor(runtime, static_cast<int>(data.length)).getObject(runtime);
  auto arrayBuffer = arrayBufferObject.getArrayBuffer(runtime);
  memcpy(arrayBuffer.data(runtime), data.bytes, data.length);

  auto uint8ArrayCtor = global.getPropertyAsFunction(runtime, "Uint8Array");
  auto uint8Array = uint8ArrayCtor.callAsConstructor(runtime, arrayBufferObject).getObject(runtime);
  return uint8Array;
}

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
  if ([value isKindOfClass:[EXJavaScriptValue class]]) {
    return [(EXJavaScriptValue *)value get];
  }
  if ([value isKindOfClass:[EXJavaScriptObject class]]) {
    return jsi::Value(runtime, *[(EXJavaScriptObject *)value get]);
  }
  if ([value isKindOfClass:[EXJavaScriptWeakObject class]]) {
    return jsi::Value(runtime, *[[(EXJavaScriptWeakObject *)value lock] get]);
  }
  if ([value isKindOfClass:[EXJavaScriptSharedObjectBinding class]]) {
    return jsi::Value(runtime, *[[(EXJavaScriptSharedObjectBinding *)value get] get]);
  }
  if ([value isKindOfClass:[NSString class]]) {
    return convertNSStringToJSIString(runtime, (NSString *)value);
  } else if ([value isKindOfClass:[NSNumber class]]) {
    if ([value isKindOfClass:[@YES class]]) {
      return convertNSNumberToJSIBoolean(runtime, (NSNumber *)value);
    }
    return convertNSNumberToJSINumber(runtime, (NSNumber *)value);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    return convertNSDictionaryToJSIObject(runtime, (NSDictionary *)value);
  } else if ([value isKindOfClass:[NSArray class]]) {
    return convertNSArrayToJSIArray(runtime, (NSArray *)value);
  } else if ([value isKindOfClass:[NSData class]]) {
    return createUint8Array(runtime, (NSData *)value);
  } else if ([value isKindOfClass:[NSURL class]]) {
    return convertNSURLToJSIString(runtime, (NSURL *)value);
  } else if (value == (id)kCFNull) {
    return jsi::Value::null();
  }
  return jsi::Value::undefined();
}

NSString *convertJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
  return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

NSArray *convertJSIArrayToNSArray(jsi::Runtime &runtime, const jsi::Array &value, std::shared_ptr<CallInvoker> jsInvoker)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    [result
        addObject:convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i), jsInvoker) ?: (id)kCFNull];
  }
  return [result copy];
}

NSArray<EXJavaScriptValue *> *convertJSIValuesToNSArray(EXJavaScriptRuntime *runtime, const jsi::Value *values, size_t count)
{
  NSMutableArray<EXJavaScriptValue *> *array = [NSMutableArray arrayWithCapacity:count];
  jsi::Runtime *jsiRuntime = [runtime get];

  for (int i = 0; i < count; i++) {
    array[i] = [[EXJavaScriptValue alloc] initWithRuntime:runtime
                                                    value:jsi::Value(*jsiRuntime, values[i])];
  }
  return array;
}

NSDictionary *convertJSIObjectToNSDictionary(jsi::Runtime &runtime, const jsi::Object &value, std::shared_ptr<CallInvoker> jsInvoker)
{
  jsi::Array propertyNames = value.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *k = convertJSIStringToNSString(runtime, name);
    id v = convertJSIValueToObjCObject(runtime, value.getProperty(runtime, name), jsInvoker);
    if (v) {
      result[k] = v;
    }
  }
  return [result copy];
}

id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value, std::shared_ptr<CallInvoker> jsInvoker)
{
  if (value.isUndefined() || value.isNull()) {
    return nil;
  }
  if (value.isBool()) {
    return @(value.getBool());
  }
  if (value.isNumber()) {
    return @(value.getNumber());
  }
  if (value.isString()) {
    return convertJSIStringToNSString(runtime, value.getString(runtime));
  }
  if (value.isObject()) {
    jsi::Object o = value.getObject(runtime);
    if (o.isArray(runtime)) {
      return convertJSIArrayToNSArray(runtime, o.getArray(runtime), jsInvoker);
    }
    if (o.isFunction(runtime)) {
      return convertJSIFunctionToCallback(runtime, std::move(o.getFunction(runtime)), jsInvoker);
    }
    return convertJSIObjectToNSDictionary(runtime, o, jsInvoker);
  }

  throw std::runtime_error("Unsupported jsi::jsi::Value kind");
}

RCTResponseSenderBlock convertJSIFunctionToCallback(jsi::Runtime &runtime, const jsi::Function &value, std::shared_ptr<CallInvoker> jsInvoker)
{
  auto weakWrapper = CallbackWrapper::createWeak(value.getFunction(runtime), runtime, jsInvoker);
  BOOL __block wrapperWasCalled = NO;
  RCTResponseSenderBlock callback = ^(NSArray *responses) {
    if (wrapperWasCalled) {
      throw std::runtime_error("callback arg cannot be called more than once");
    }

    auto strongWrapper = weakWrapper.lock();
    if (!strongWrapper) {
      return;
    }

    strongWrapper->jsInvoker().invokeAsync([weakWrapper, responses]() {
      auto strongWrapper2 = weakWrapper.lock();
      if (!strongWrapper2) {
        return;
      }

      std::vector<jsi::Value> args = convertNSArrayToStdVector(strongWrapper2->runtime(), responses);
      strongWrapper2->callback().call(strongWrapper2->runtime(), (const jsi::Value *)args.data(), args.size());
      strongWrapper2->destroy();
    });

    wrapperWasCalled = YES;
  };

  return callback;
}

} // namespace expo
