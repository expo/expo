// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/EXRawJavaScriptFunction.h>
#import <ExpoModulesCore/EXJavaScriptTypedArray.h>
#import <ExpoModulesCore/TypedArray.h>

@implementation EXJavaScriptValue {
  __weak EXJavaScriptRuntime *_runtime;

  /**
   The underlying JS value of which the `JavaScriptValue` is the only owner.
   */
  jsi::Value _value;
}

- (nonnull instancetype)initWithRuntime:(nullable EXJavaScriptRuntime *)runtime
                                  value:(jsi::Value)value
{
  if (self = [super init]) {
    _runtime = runtime;
    _value = std::move(value);
  }
  return self;
}

- (jsi::Value)get
{
  return jsi::Value(*[_runtime get], _value);
}

#pragma mark - Type checking

- (BOOL)isUndefined
{
  return _value.isUndefined();
}

- (BOOL)isNull
{
  return _value.isNull();
}

- (BOOL)isBool
{
  return _value.isBool();
}

- (BOOL)isNumber
{
  return _value.isNumber();
}

- (BOOL)isString
{
  return _value.isString();
}

- (BOOL)isSymbol
{
  return _value.isSymbol();
}

- (BOOL)isObject
{
  return _value.isObject();
}

- (BOOL)isFunction
{
  if (_value.isObject()) {
    jsi::Runtime *runtime = [_runtime get];
    return _value.getObject(*runtime).isFunction(*runtime);
  }
  return false;
}

- (BOOL)isTypedArray
{
  if (_value.isObject()) {
    jsi::Runtime *runtime = [_runtime get];
    return expo::isTypedArray(*runtime, _value.getObject(*runtime));
  }
  return false;
}

#pragma mark - Type casting

- (nullable id)getRaw
{
  return expo::convertJSIValueToObjCObject(*[_runtime get], _value, [_runtime callInvoker]);
}

- (BOOL)getBool
{
  return _value.getBool();
}

- (NSInteger)getInt
{
  return _value.getNumber();
}

- (double)getDouble
{
  return _value.getNumber();
}

- (nonnull NSString *)getString
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIStringToNSString(*runtime, _value.getString(*runtime));
}

- (nonnull NSArray<EXJavaScriptValue *> *)getArray
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Array jsiArray = _value.getObject(*runtime).getArray(*runtime);
  size_t arraySize = jsiArray.size(*runtime);
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:arraySize];

  for (size_t i = 0; i < arraySize; i++) {
    jsi::Value item = jsiArray.getValueAtIndex(*runtime, i);

    if (item.isUndefined() || item.isNull()) {
      [result addObject:(id)kCFNull];
    } else {
      [result addObject:[[EXJavaScriptValue alloc] initWithRuntime:_runtime value:std::move(item)]];
    }
  }
  return result;
}

- (nonnull NSDictionary<NSString *, id> *)getDictionary
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIObjectToNSDictionary(*runtime, _value.getObject(*runtime), [_runtime callInvoker]);
}

- (nonnull EXJavaScriptObject *)getObject
{
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Object> objectPtr = std::make_shared<jsi::Object>(_value.asObject(*runtime));
  return [[EXJavaScriptObject alloc] initWith:objectPtr runtime:_runtime];
}

- (nonnull EXRawJavaScriptFunction *)getFunction
{
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Function> functionPtr = std::make_shared<jsi::Function>(_value.asObject(*runtime).asFunction(*runtime));
  return [[EXRawJavaScriptFunction alloc] initWith:functionPtr runtime:_runtime];
}

- (nullable EXJavaScriptTypedArray *)getTypedArray
{
  if (![self isTypedArray]) {
    return nil;
  }
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Object> objectPtr = std::make_shared<jsi::Object>(_value.asObject(*runtime));
  return [[EXJavaScriptTypedArray alloc] initWith:objectPtr runtime:_runtime];
}

#pragma mark - Helpers

- (nonnull NSString *)toString
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIStringToNSString(*runtime, _value.toString(*runtime));
}

#pragma mark - Static properties

+ (nonnull EXJavaScriptValue *)undefined
{
  auto undefined = std::make_shared<jsi::Value>();
  return [[EXJavaScriptValue alloc] initWithRuntime:nil value:jsi::Value::undefined()];
}

+ (nonnull EXJavaScriptValue *)number:(double)value
{
  return [[EXJavaScriptValue alloc] initWithRuntime:nil value:jsi::Value(value)];
}

+ (nonnull EXJavaScriptValue *)string:(nonnull NSString *)value runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Runtime *jsiRuntime = [runtime get];
  return [[EXJavaScriptValue alloc] initWithRuntime:runtime
                                              value:expo::convertNSStringToJSIString(*jsiRuntime, value)];
}

+ (nonnull EXJavaScriptValue *)from:(nullable id)value runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Runtime *jsiRuntime = [runtime get];
  return [[EXJavaScriptValue alloc] initWithRuntime:runtime
                                              value:expo::convertObjCObjectToJSIValue(*jsiRuntime, value)];
}

@end
