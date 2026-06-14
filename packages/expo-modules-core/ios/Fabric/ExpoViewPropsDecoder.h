// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>
#include <string>
#include <unordered_map>

#include <jsi/jsi.h>

#include <ExpoModulesCore/ExpoAppContextHolder.h>

namespace expo {

/**
 The Objective-C box that weakly holds the Expo `AppContext`. Declared opaque in
 `ExpoAppContextHolder.h`; defined in `ExpoViewPropsDecoder.mm`.
 */
class ExpoAppContextBox {
public:
  explicit ExpoAppContextBox(id appContext);
  ~ExpoAppContextBox();

  /**
   The boxed app context if still alive, or `nil`. Returned as a `void *` to keep this
   header includable from pure-C++ translation units; callers in Objective-C++ bridge it
   back to the app context type.
   */
  void *appContext() const;

private:
  // Opaque storage for the `__weak id` (size of a pointer). Manipulated only in the .mm.
  void *_storage;
};

/**
 Creates a holder weakly wrapping the given Expo `AppContext` (passed as an opaque `id`).
 Called from `ExpoReactNativeFactory.mm` when injecting into the `ContextContainer`.
 */
ExpoAppContextHolder makeAppContextHolder(id appContext);

/**
 Decodes the given JSI-backed view props on the JavaScript thread, using the Swift
 `ViewDefinition` reachable from the app context boxed in `holder`.

 - `componentName`: the dynamic view class name (e.g. `ViewManagerAdapter_ExpoImage_<appId>`),
   used to resolve the module + view definition.
 - `runtime` / `propsObject`: the live props object to read each declared prop's value from.
 - `holder`: the app context holder previously stored in the `ContextContainer`.

 Returns a retained Objective-C container (an `NSDictionary *` boxed as a `void *`, ownership
 transferred to the caller via `CFBridgingRetain`) mapping prop names to decoded Swift values,
 or `nullptr` if nothing could be decoded (no app context, no view definition, etc.). Props not
 declared by the view, or that fail to decode, are omitted and left for the legacy path.

 MUST be called on the JavaScript thread.
 */
void *decodeViewProps(
  const std::string &componentName,
  facebook::jsi::Runtime &runtime,
  const facebook::jsi::Value &propsObject,
  const ExpoAppContextHolder &holder
);

/**
 Adopts a retained Objective-C container previously returned by `decodeViewProps` into a
 type-erased `shared_ptr<void>`, whose deleter releases the object (via `CFBridgingRelease`)
 when the last reference goes away. This lets the decoded props ride along with the
 (copyable, value-semantic) `ExpoViewProps` and be released exactly once.
 */
std::shared_ptr<void> makeDecodedPropsHandle(void *retainedDecodedProps);

} // namespace expo

#endif // __cplusplus
