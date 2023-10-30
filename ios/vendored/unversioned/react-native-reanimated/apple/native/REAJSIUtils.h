#pragma once

#include <jsi/jsi.h>

using namespace facebook;

// Copied from RCTTurboModule.mm

/**
 * All static helper functions are ObjC++ specific.
 */
static jsi::Value convertNSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value((bool)[value boolValue]);
}

static jsi::Value convertNSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value([value doubleValue]);
}

static jsi::String convertNSStringToJSIString(jsi::Runtime &runtime, NSString *value)
{
  return jsi::String::createFromUtf8(runtime, [value UTF8String] ?: "");
}

static jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
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

static jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
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
  } else if (value == (id)kCFNull) {
    return jsi::Value::null();
  }
  return jsi::Value::undefined();
}

// Other

static id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value);

static NSString *convertJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
  return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

static NSDictionary *convertJSIObjectToNSDictionary(jsi::Runtime &runtime, const jsi::Object &value)
{
  jsi::Array propertyNames = value.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *k = convertJSIStringToNSString(runtime, name);
    id v = convertJSIValueToObjCObject(runtime, value.getProperty(runtime, name));
    if (v) {
      result[k] = v;
    }
  }
  return [result copy];
}

static NSArray *convertJSIArrayToNSArray(jsi::Runtime &runtime, const jsi::Array &value)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    [result addObject:convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i)) ?: (id)kCFNull];
  }
  return [result copy];
}

static id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value)
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
      return convertJSIArrayToNSArray(runtime, o.getArray(runtime));
    }
    return convertJSIObjectToNSDictionary(runtime, o);
  }

  throw std::runtime_error("[Reanimated] Unsupported jsi::Value kind.");
}
