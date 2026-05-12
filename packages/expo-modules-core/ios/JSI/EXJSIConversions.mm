// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>

namespace expo {

static jsi::Object convertNSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value)
{
  jsi::Object result = jsi::Object(runtime);
  for (NSString *k in value) {
    result.setProperty(runtime, [k UTF8String], convertObjCObjectToJSIValue(runtime, value[k]));
  }
  return result;
}

static jsi::Array convertNSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value)
{
  jsi::Array result = jsi::Array(runtime, value.count);
  for (size_t i = 0; i < value.count; i++) {
    result.setValueAtIndex(runtime, i, convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

static jsi::Value createUint8Array(jsi::Runtime &runtime, NSData *data)
{
  auto global = runtime.global();
  auto arrayBufferCtor = global.getPropertyAsFunction(runtime, "ArrayBuffer");
  auto arrayBufferObject = arrayBufferCtor.callAsConstructor(runtime, static_cast<int>(data.length)).getObject(runtime);
  auto arrayBuffer = arrayBufferObject.getArrayBuffer(runtime);
  memcpy(arrayBuffer.data(runtime), data.bytes, data.length);

  auto uint8ArrayCtor = global.getPropertyAsFunction(runtime, "Uint8Array");
  return uint8ArrayCtor.callAsConstructor(runtime, arrayBufferObject);
}

id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value)
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
    return [NSString stringWithUTF8String:value.getString(runtime).utf8(runtime).c_str()];
  }
  if (!value.isObject()) {
    return nil;
  }
  jsi::Object obj = value.getObject(runtime);
  if (obj.isFunction(runtime)) {
    return nil;
  }
  if (obj.isArray(runtime)) {
    jsi::Array arr = obj.getArray(runtime);
    size_t count = arr.size(runtime);
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:count];
    for (size_t i = 0; i < count; i++) {
      id element = convertJSIValueToObjCObject(runtime, arr.getValueAtIndex(runtime, i));
      [result addObject:element ?: [NSNull null]];
    }
    return result;
  }
  jsi::Array propertyNames = obj.getPropertyNames(runtime);
  size_t propertyCount = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:propertyCount];
  for (size_t i = 0; i < propertyCount; i++) {
    jsi::String nameString = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *key = [NSString stringWithUTF8String:nameString.utf8(runtime).c_str()];
    id converted = convertJSIValueToObjCObject(runtime, obj.getProperty(runtime, nameString));
    result[key] = converted ?: [NSNull null];
  }
  return result;
}

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
  if (!value || value == (id)kCFNull) {
    return jsi::Value::null();
  }
  if ([value isKindOfClass:[NSString class]]) {
    return jsi::String::createFromUtf8(runtime, [value UTF8String]);
  }
  if ([value isKindOfClass:[NSNumber class]]) {
    if ([value isKindOfClass:[@YES class]]) {
      return jsi::Value((bool)[value boolValue]);
    }
    return jsi::Value([value doubleValue]);
  }
  if ([value isKindOfClass:[NSDictionary class]]) {
    return convertNSDictionaryToJSIObject(runtime, (NSDictionary *)value);
  }
  if ([value isKindOfClass:[NSArray class]]) {
    return convertNSArrayToJSIArray(runtime, (NSArray *)value);
  }
  if ([value isKindOfClass:[NSData class]]) {
    return createUint8Array(runtime, (NSData *)value);
  }
  if ([value isKindOfClass:[NSURL class]]) {
    return jsi::String::createFromUtf8(runtime, [[(NSURL *)value absoluteString] UTF8String]);
  }
  return jsi::Value::undefined();
}

} // namespace expo
