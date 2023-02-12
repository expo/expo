// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/EXJavaScriptTypedArray.h>
#import <ExpoModulesCore/TypedArray.h>

@implementation EXJavaScriptValue {
  __weak EXJavaScriptRuntime *_runtime;
  std::shared_ptr<jsi::Value> _value;
}

- (nonnull instancetype)initWithRuntime:(nonnull EXJavaScriptRuntime *)runtime
                                  value:(std::shared_ptr<jsi::Value>)value
{
  if (self = [super init]) {
    _runtime = runtime;
    _value = value;
  }
  return self;
}

- (nonnull jsi::Value *)get
{
  return _value.get();
}

#pragma mark - Type checking

- (BOOL)isUndefined
{
  return _value->isUndefined();
}

- (BOOL)isNull
{
  return _value->isNull();
}

- (BOOL)isBool
{
  return _value->isBool();
}

- (BOOL)isNumber
{
  return _value->isNumber();
}

- (BOOL)isString
{
  return _value->isString();
}

- (BOOL)isSymbol
{
  return _value->isSymbol();
}

- (BOOL)isObject
{
  return _value->isObject();
}

- (BOOL)isFunction
{
  if (_value->isObject()) {
    jsi::Runtime *runtime = [_runtime get];
    return _value->getObject(*runtime).isFunction(*runtime);
  }
  return false;
}

- (BOOL)isTypedArray
{
  if (_value->isObject()) {
    jsi::Runtime *runtime = [_runtime get];
    return expo::isTypedArray(*runtime, _value->getObject(*runtime));
  }
  return false;
}

#pragma mark - Type casting

- (nullable id)getRaw
{
  return expo::convertJSIValueToObjCObject(*[_runtime get], *_value, [_runtime callInvoker]);
}

- (BOOL)getBool
{
  return _value->getBool();
}

- (NSInteger)getInt
{
  return _value->getNumber();
}

- (double)getDouble
{
  return _value->getNumber();
}

- (nonnull NSString *)getString
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIStringToNSString(*runtime, _value->getString(*runtime));
}

- (nonnull NSArray<EXJavaScriptValue *> *)getArray
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Array jsiArray = _value->getObject(*runtime).getArray(*runtime);
  size_t arraySize = jsiArray.size(*runtime);
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:arraySize];

  for (size_t i = 0; i < arraySize; i++) {
    jsi::Value item = jsiArray.getValueAtIndex(*runtime, i);

    if (item.isUndefined() || item.isNull()) {
      [result addObject:(id)kCFNull];
    } else {
      std::shared_ptr<jsi::Value> valuePtr = std::make_shared<jsi::Value>(*runtime, item);
      [result addObject:[[EXJavaScriptValue alloc] initWithRuntime:_runtime value:valuePtr]];
    }
  }
  return result;
}

- (nonnull NSDictionary<NSString *, id> *)getDictionary
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIObjectToNSDictionary(*runtime, _value->getObject(*runtime), [_runtime callInvoker]);
}

- (nonnull EXJavaScriptObject *)getObject
{
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Object> objectPtr = std::make_shared<jsi::Object>(_value->asObject(*runtime));
  return [[EXJavaScriptObject alloc] initWith:objectPtr runtime:_runtime];
}

- (nullable EXJavaScriptTypedArray *)getTypedArray
{
  if (![self isTypedArray]) {
    return nil;
  }
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Object> objectPtr = std::make_shared<jsi::Object>(_value->asObject(*runtime));
  return [[EXJavaScriptTypedArray alloc] initWith:objectPtr runtime:_runtime];
}

#pragma mark - Helpers

- (nonnull NSString *)toString
{
  jsi::Runtime *runtime = [_runtime get];
  return expo::convertJSIStringToNSString(*runtime, _value->toString(*runtime));
}

@end
