// Copyright 2022-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIConversions.h>
#import <ExpoModulesCore/EXJavaScriptValue.h>
#import <ExpoModulesCore/EXJavaScriptObject.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/EXJavaScriptWeakObject.h>
#import <ExpoModulesCore/EXJSIUtils.h>
#import <ExpoModulesCore/JSIUtils.h>

@implementation EXJavaScriptObject {
  /**
   Pointer to the `EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the original JSI object that is being wrapped by `EXJavaScriptObject` class.
   */
  std::shared_ptr<jsi::Object> _jsObjectPtr;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObjectPtr
                         runtime:(nonnull EXJavaScriptRuntime *)runtime
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

- (nonnull EXJavaScriptValue *)getProperty:(nonnull NSString *)name
{
  return [[EXJavaScriptValue alloc] initWithRuntime:_runtime
                                              value:_jsObjectPtr->getProperty(*[_runtime get], [name UTF8String])];
}

- (nonnull NSArray<NSString *> *)getPropertyNames
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Array propertyNamesArray = _jsObjectPtr->getPropertyNames(*[_runtime get]);
  return expo::convertJSIArrayToNSArray(*runtime, propertyNamesArray, nullptr);
}

#pragma mark - Modifying object properties

- (void)setProperty:(nonnull NSString *)name value:(nullable id)value
{
  jsi::Value jsiValue = expo::convertObjCObjectToJSIValue(*[_runtime get], value);
  _jsObjectPtr->setProperty(*[_runtime get], [name UTF8String], jsiValue);
}

- (void)defineProperty:(nonnull NSString *)name descriptor:(nonnull EXJavaScriptObject *)descriptor
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object *jsThis = _jsObjectPtr.get();

  expo::common::defineProperty(*runtime, jsThis, [name UTF8String], std::move(*[descriptor get]));
}

- (void)defineProperty:(nonnull NSString *)name value:(nullable id)value options:(EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object *jsThis = _jsObjectPtr.get();

  jsi::Object descriptor = [self preparePropertyDescriptorWithOptions:options];
  descriptor.setProperty(*runtime, "value", expo::convertObjCObjectToJSIValue(*runtime, value));

  expo::common::defineProperty(*runtime, jsThis, [name UTF8String], std::move(descriptor));
}

#pragma mark - WeakObject

- (nonnull EXJavaScriptWeakObject *)createWeak
{
  return [[EXJavaScriptWeakObject alloc] initWith:_jsObjectPtr runtime:_runtime];
}

#pragma mark - Deallocator

- (void)setObjectDeallocator:(void (^)(void))deallocatorBlock
{
  expo::common::setDeallocator(*[_runtime get], _jsObjectPtr, deallocatorBlock);
}

#pragma mark - Equality

- (BOOL)isEqual:(id)object
{
  if ([object isKindOfClass:EXJavaScriptObject.class]) {
    jsi::Runtime *runtime = [_runtime get];
    jsi::Object *a = _jsObjectPtr.get();
    jsi::Object *b = [(EXJavaScriptObject *)object get];
    return jsi::Object::strictEquals(*runtime, *a, *b);
  }
  return false;
}

#pragma mark - Memory pressure

- (void)setExternalMemoryPressure:(size_t)size
{
  _jsObjectPtr->setExternalMemoryPressure(*[_runtime get], size);
}

#pragma mark - Private helpers

- (jsi::Object)preparePropertyDescriptorWithOptions:(EXJavaScriptObjectPropertyDescriptor)options
{
  jsi::Runtime *runtime = [_runtime get];
  jsi::Object descriptor(*runtime);
  descriptor.setProperty(*runtime, "configurable", (bool)(options & EXJavaScriptObjectPropertyDescriptorConfigurable));
  descriptor.setProperty(*runtime, "enumerable", (bool)(options & EXJavaScriptObjectPropertyDescriptorEnumerable));
  descriptor.setProperty(*runtime, "writable", (bool)(options & EXJavaScriptObjectPropertyDescriptorWritable));
  return descriptor;
}

@end
