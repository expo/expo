// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJSIUtils.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptWeakObject.h>

@implementation ABI47_0_0EXJavaScriptWeakObject {
  /**
   Pointer to the `ABI47_0_0EXJavaScriptRuntime` wrapper.

   \note It must be weak because only then the original runtime can be safely deallocated
   when the JS engine wants to without unsetting it on each created object.
   */
  __weak ABI47_0_0EXJavaScriptRuntime *_runtime;

  /**
   Shared pointer to the `WeakRef` JS object.
   */
  std::shared_ptr<jsi::Object> _jsObject;
}

- (nonnull instancetype)initWith:(std::shared_ptr<jsi::Object>)jsObject
                         runtime:(nonnull ABI47_0_0EXJavaScriptRuntime *)runtime
{
  if (self = [super init]) {
    _runtime = runtime;

    // Check whether the runtime supports `WeakRef` objects. If it does not,
    // we consciously hold a strong reference to the object and cause memory leaks.
    // This is the case on hermes and JSC prior to iOS 14.5.
    // TODO: (@tsapeta) Use `jsi::WeakObject` on hermes
    if (ABI47_0_0expo::isWeakRefSupported(*[runtime get])) {
      _jsObject = ABI47_0_0expo::createWeakRef(*[runtime get], jsObject);
    } else {
      _jsObject = jsObject;
    }
  }
  return self;
}

- (nullable ABI47_0_0EXJavaScriptObject *)lock
{
  jsi::Runtime *runtime = [_runtime get];
  std::shared_ptr<jsi::Object> objectPtr = ABI47_0_0expo::isWeakRefSupported(*runtime)
    ? ABI47_0_0expo::derefWeakRef(*runtime, _jsObject)
    : _jsObject;

  if (!objectPtr) {
    return nil;
  }
  return [[ABI47_0_0EXJavaScriptObject alloc] initWith:objectPtr runtime:_runtime];
}

@end
