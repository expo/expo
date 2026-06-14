// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/ExpoViewPropsDecoder.h>

// We can't import the generated `ExpoModulesCore-Swift.h` here: in the precompiled-xcframework
// build the Objective-C++ target compiles before the Swift target, so that header doesn't exist
// yet. Instead we hand-declare the `EXViewPropsJSIDecoder` Swift class (the symbol links from the
// Swift target), mirroring the pattern in `WorkletIntegrationLoader.mm`. Keep this in sync with
// `ViewPropsJSIDecoder.decodeProps(forClassName:appContext:propsObjectPointer:)` in
// `ExpoViewPropsJSIDecoding.swift`.
@class EXAppContext;
@class EXDecodedViewProps;

@interface EXViewPropsJSIDecoder : NSObject
+ (nullable EXDecodedViewProps *)decodePropsForClassName:(nonnull NSString *)className
                                              appContext:(nonnull EXAppContext *)appContext
                                      propsObjectPointer:(nonnull const void *)propsObjectPointer;
@end

namespace expo {

#pragma mark - ExpoAppContextBox

// The box stores a `__weak id` inside an opaque pointer. We manage the ARC lifetime
// manually (this file is compiled with ARC, but the storage crosses into pure-C++ headers).

ExpoAppContextBox::ExpoAppContextBox(id appContext)
{
  // Value-initialize the weak slot (`{}`) so ARC sees a valid (nil) `__weak` before the
  // assignment; `new __weak id` alone would leave it uninitialized and crash on assign.
  __weak id *slot = new __weak id{};
  *slot = appContext;
  _storage = static_cast<void *>(slot);
}

ExpoAppContextBox::~ExpoAppContextBox()
{
  __weak id *slot = static_cast<__weak id *>(_storage);
  delete slot;
}

void *ExpoAppContextBox::appContext() const
{
  __weak id *slot = static_cast<__weak id *>(_storage);
  // Promote the weak reference to a strong local; returns nil if the context was deallocated.
  // The returned pointer is only used synchronously by the caller on the same thread.
  id strong = *slot;
  return (__bridge void *)strong;
}

#pragma mark - Holder factory

ExpoAppContextHolder makeAppContextHolder(id appContext)
{
  return ExpoAppContextHolder(std::make_shared<ExpoAppContextBox>(appContext));
}

#pragma mark - Decoding

void *decodeViewProps(
  const std::string &componentName,
  facebook::jsi::Runtime &runtime,
  const facebook::jsi::Value &propsObject,
  const ExpoAppContextHolder &holder
)
{
  const auto &box = holder.box();
  if (!box) {
    return nullptr;
  }

  id appContext = (__bridge id)box->appContext();
  if (appContext == nil) {
    // The app context has been deallocated.
    return nullptr;
  }

  NSString *className = [NSString stringWithUTF8String:componentName.c_str()];

  // Hand the props object to Swift as a raw pointer; Swift copies it against the runtime
  // (already the runtime backing this value) and decodes each declared prop.
  const void *propsPointer = static_cast<const void *>(&propsObject);

  EXDecodedViewProps *decoded =
      [EXViewPropsJSIDecoder decodePropsForClassName:className
                                          appContext:(EXAppContext *)appContext
                                  propsObjectPointer:propsPointer];

  if (decoded == nil) {
    return nullptr;
  }

  // Transfer ownership to the caller; balanced by `CFBridgingRelease` on the C++ side.
  return (void *)CFBridgingRetain(decoded);
}

std::shared_ptr<void> makeDecodedPropsHandle(void *retainedDecodedProps)
{
  if (retainedDecodedProps == nullptr) {
    return nullptr;
  }
  return std::shared_ptr<void>(retainedDecodedProps, [](void *ptr) {
    if (ptr != nullptr) {
      // Balances the `CFBridgingRetain` in `decodeViewProps`.
      CFBridgingRelease(ptr);
    }
  });
}

} // namespace expo
