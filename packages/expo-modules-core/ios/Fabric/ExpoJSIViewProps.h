// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <memory>

#include <ExpoModulesCore/ExpoViewProps.h>

namespace expo {

/**
 iOS-only `ExpoViewProps` subclass used by `ExpoViewJSIComponentDescriptor`. It carries the
 props that were decoded straight from their JavaScript values on the JavaScript thread, so
 the shared `ExpoViewProps` (which is also compiled into the Android build) stays free of any
 JSI/Objective-C dependency.
 */
class ExpoJSIViewProps : public ExpoViewProps {
public:
  ExpoJSIViewProps() = default;

  ExpoJSIViewProps(
    const facebook::react::PropsParserContext &context,
    const ExpoJSIViewProps &sourceProps,
    const facebook::react::RawProps &rawProps,
    const std::function<bool(const std::string &)> &filterObjectKeys = nullptr
    // Skip the `folly::dynamic` lowering into `propsMap`: these props are decoded straight from
    // their JavaScript values and `propsMap` is never read on this path.
  ) : ExpoViewProps(context, sourceProps, rawProps, filterObjectKeys, /* buildPropsMap */ false) {}

  /**
   View props decoded straight from their JavaScript values during props parsing (see the JSI
   view-props decoding design). Type-erased to a `void` shared pointer that retains a Swift
   `EXDecodedViewProps` object; the deleter releases it via `CFBridgingRelease`. Set by
   `ExpoViewJSIComponentDescriptor::cloneProps`, read on the main thread in `finalizeUpdates:`.

   `shared_ptr` so the (copyable, value-semantic) props object can be cloned by Fabric while
   the decoded container is released exactly once. `mutable` because it is filled in by
   `cloneProps` after the props object is already held as `const`.
   */
  mutable std::shared_ptr<void> decodedProps;
};

} // namespace expo

#endif // __cplusplus
