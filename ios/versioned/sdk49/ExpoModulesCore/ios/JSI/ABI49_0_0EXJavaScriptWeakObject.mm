// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJSIUtils.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXJavaScriptWeakObject.h>

@implementation ABI49_0_0EXJavaScriptWeakObject {
  /**
   Pointer to the `ABI49_0_0EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak ABI49_0_0EXJavaScriptRuntime *_runtime;

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
  /**
   A weak reference to a JS object. Available only on Hermes engine.
   */
  std::shared_ptr<jsi::WeakObject> _weakObject;
#else
  /**
   Shared pointer to the `WeakRef` JS object. Available only on JSC engine.
   */
  std::shared_ptr<jsi::Object> _weakObject;
#endif
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObject
                         runtime:(nonnull ABI49_0_0EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
    _weakObject = std::make_shared<jsi::WeakObject>(*[runtime get], *jsObject);
#else
    // Check whether the runtime supports `WeakRef` objects. If it does not,
    // we consciously hold a strong reference to the object and cause memory leaks.
    // This is the case on JSC prior to iOS 14.5.
    if (ABI49_0_0expo::isWeakRefSupported(*[runtime get])) {
      _weakObject = ABI49_0_0expo::createWeakRef(*[runtime get], jsObject);
    } else {
      _weakObject = jsObject;
    }
#endif
  }
  return self;
}

- (nullable ABI49_0_0EXJavaScriptObject *)lock
{
  jsi::Runtime *runtime = [_runtime get];

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
  jsi::Value value = _weakObject->lock(*runtime);

  // `lock` returns an undefined value if the underlying object no longer exists.
  if (value.isUndefined()) {
    return nil;
  }
  std::shared_ptr<jsi::Object> objectPtr = std::make_shared<jsi::Object>(value.asObject(*runtime));
#else
  std::shared_ptr<jsi::Object> objectPtr = ABI49_0_0expo::isWeakRefSupported(*runtime)
    ? ABI49_0_0expo::derefWeakRef(*runtime, _weakObject)
    : _weakObject;
#endif

  if (!objectPtr) {
    return nil;
  }
  return [[ABI49_0_0EXJavaScriptObject alloc] initWith:objectPtr runtime:_runtime];
}

@end
