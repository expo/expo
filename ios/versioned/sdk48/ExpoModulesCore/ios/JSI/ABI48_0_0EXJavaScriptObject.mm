// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJSIConversions.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptValue.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptObject.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptRuntime.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptWeakObject.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJSIUtils.h>

@implementation ABI48_0_0EXJavaScriptObject {
  /**
   Pointer to the `ABI48_0_0EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak ABI48_0_0EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the original JSI object that is being wrapped by `ABI48_0_0EXJavaScriptObject` class.
   */
  std::shared_ptr<jsi::Object> _jsObjectPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull ABI48_0_0EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;
    _jsObjectPtr = jsObjectPtr;
  }
  return self;
}

- (nonnull jsi::Object *)get
{
  return _jsObjectPtr.get();
}

- (std::shared_ptr<jsi::Object>)getShared
{
  return _jsObjectPtr;
}

#pragma mark - Accessing object properties

- (BOOL)hasProperty:(nonnull NSString *)name
{
  return _jsObjectPtr->hasProperty(*[_runtime get], [name UTF8String]);
}

- (nonnull ABI48_0_0EXJavaScriptValue *)getProperty:(nonnull NSString *)name
{
  std::shared_ptr<jsi::Value> value = std::make_shared<jsi::Value>(_jsObjectPtr->getProperty(*[_runtime get], [name UTF8String]));
  return [[ABI48_0_0EXJavaScriptValue alloc] initWithRuntime:_runtime value:value];
}

- (nonnull NSArray<NSString *> *)getPropertyNames
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Array propertyNamesArray = _jsObjectPtr->getPropertyNames(*[_runtime get]);
  return ABI48_0_0expo::convertJSIArrayToNSArray(*runtime, propertyNamesArray, nullptr);
}

#pragma mark - Modifying object properties

- (void)setProperty:(nonnull NSString *)name value:(nullable id)value
{
  jsi::Value jsiValue = ABI48_0_0expo::convertObjCObjectToJSIValue(*[_runtime get], value);
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], jsiValue);
}

- (void)defineProperty:(nonnull NSString *)name descriptor:(nonnull ABI48_0_0EXJavaScriptObject *)descriptor
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object global = runtime->global();
  jsi::Object objectClass = global.getPropertyAsObject(*runtime, "Object");
  jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(*runtime, "defineProperty");

  // This call is basically the same as `Object.defineProperty(object, name, descriptor)` in JS
  definePropertyFunction.callWithThis(*runtime, objectClass, {
    jsi::Value(*runtime, *_jsObjectPtr.get()),
    jsi::String::createFromUtf8(*runtime, [name UTF8String]),
    std::move(*[descriptor get]),
  });
}

- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(ABI48_0_0EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object global = runtime->global();
  jsi::Object objectClass = global.getPropertyAsObject(*runtime, "Object");
  jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(*runtime, "defineProperty");
  jsi::Object descriptor = [self preparePropertyDescriptorWithOptions:options];

  descriptor.setProperty(*runtime, "value", ABI48_0_0expo::convertObjCObjectToJSIValue(*runtime, value));

  // This call is basically the same as `Object.defineProperty(object, name, descriptor)` in JS
  definePropertyFunction.callWithThis(*runtime, objectClass, {
    jsi::Value(*runtime, *_jsObjectPtr.get()),
    jsi::String::createFromUtf8(*runtime, [name UTF8String]),
    std::move(descriptor),
  });
}

#pragma mark - WeakObject

- (nonnull ABI48_0_0EXJavaScriptWeakObject *)createWeak
{
  return [[ABI48_0_0EXJavaScriptWeakObject alloc] initWith:_jsObjectPtr runtime:_runtime];
}

#pragma mark - Deallocator

- (void)setObjectDeallocator:(void (^)(void))deallocatorBlock
{
  ABI48_0_0expo::setDeallocator(*[_runtime get], _jsObjectPtr, deallocatorBlock);
}

#pragma mark - Equality

- (BOOL)isEqual:(id)object
{
  if ([object isKindOfClass:ABI48_0_0EXJavaScriptObject.class]) {
    jsi::Runtime *runtime = [_runtime get];
    jsi::Object *a = _jsObjectPtr.get();
    jsi::Object *b = [object get];
    return jsi::Object::strictEquals(*runtime, *a, *b);
  }
  return false;
}

#pragma mark - Private helpers

- (jsi::Object)preparePropertyDescriptorWithOptions:(ABI48_0_0EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object descriptor(*runtime);
  descriptor.setProperty(*runtime, "configurable", (bool)(options & ABI48_0_0EXJavaScriptObjectPropertyDescriptorConfigurable));
  descriptor.setProperty(*runtime, "enumerable", (bool)(options & ABI48_0_0EXJavaScriptObjectPropertyDescriptorEnumerable));
  descriptor.setProperty(*runtime, "writable", (bool)(options & ABI48_0_0EXJavaScriptObjectPropertyDescriptorWritable));
  return descriptor;
}

@end
