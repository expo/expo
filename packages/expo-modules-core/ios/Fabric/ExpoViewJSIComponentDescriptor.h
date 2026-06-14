// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/utils/ContextContainer.h>

#include <ExpoModulesCore/ExpoViewComponentDescriptor.h>

#include "ExpoAppContextHolder.h"
#include "ExpoJSIViewProps.h"
#include "ExpoRawPropsAccess.h"
#include "ExpoViewPropsDecoder.h"

namespace expo {

/**
 Component descriptor that decodes view props straight from their JavaScript values on the
 JavaScript thread, during props parsing, instead of lowering them to `folly::dynamic` and
 decoding on the main thread. Used by UIKit `ExpoView`s; SwiftUI and Android keep using the
 plain `ExpoViewComponentDescriptor`.

 Lives in `ios/Fabric` (not `common/cpp`) so none of the JSI/Objective-C machinery it pulls in
 is reachable from the Android build.
 */
template<typename ShadowNodeType = ExpoViewShadowNode<ExpoJSIViewProps, ExpoViewState>>
class ExpoViewJSIComponentDescriptor : public ExpoViewComponentDescriptor<ShadowNodeType> {
public:
  using ExpoViewComponentDescriptor<ShadowNodeType>::ExpoViewComponentDescriptor;

  /**
   Decodes view props from their live `jsi::Value` before delegating to the base
   implementation. This runs synchronously during `createNode`/`cloneNode`, on the JS thread,
   while `rawProps` still holds the live `jsi::Value`. The decoded values are stashed on the
   resulting `ExpoJSIViewProps` and applied to the view later on the main thread.

   The props of an `ExpoView` always arrive JSI-backed (the only non-JSI-backed path,
   `setNativeProps_DEPRECATED`, is never used on `ExpoView`s), so there is no `folly::dynamic`
   fallback here. If the app context can't be resolved (which can only happen for a clone that
   races host setup before the context is injected), the decode is skipped and the props apply
   on the next update; a debug assert flags it so it surfaces during development.
   */
  facebook::react::Props::Shared cloneProps(
    const facebook::react::PropsParserContext &context,
    const facebook::react::Props::Shared &props,
    facebook::react::RawProps rawProps
  ) const override {
    // Decode *before* delegating to the base implementation, which consumes `rawProps` by
    // value (moves it in); afterwards its `jsi::Value` would be gone. We're on the JS thread
    // here (synchronous `createNode`/`cloneNode`), so the live JSI value is safe to read.
    // `decodeViewProps` returns null for views not registered for JSI decoding (e.g. SwiftUI,
    // which applies props from the lowered dictionary), so those fall back to `propsMap` below.
    void *decoded = nullptr;
    if (rawPropsIsJSIBacked(rawProps)) {
      if (const auto holderPtr = context.contextContainer.find<ExpoAppContextHolder>(
            ExpoAppContextHolder::kContextContainerKey)) {
        decoded = decodeViewProps(
          this->getComponentName(),
          *rawPropsRuntime(rawProps),
          rawPropsValue(rawProps),
          holderPtr.value());
      }
    }

    // When nothing decoded (props not JSI-backed, or a view that doesn't JSI-decode such as
    // SwiftUI), build `propsMap` from the still-live `rawProps` before the base moves it, so the
    // view's legacy dictionary path still has props to apply. The source props seed the map (it's
    // null on `createNode`, in which case the map starts empty).
    std::unordered_map<std::string, folly::dynamic> propsMap;
    if (decoded == nullptr) {
      static const ExpoViewProps emptyProps{};
      const auto sourceProps = std::dynamic_pointer_cast<const ExpoViewProps>(props);
      propsMap = propsMapFromProps(sourceProps ? *sourceProps : emptyProps, rawProps);
    }

    auto cloned = ExpoViewComponentDescriptor<ShadowNodeType>::cloneProps(
      context, props, std::move(rawProps));

    if (const auto expoProps = std::dynamic_pointer_cast<const ExpoJSIViewProps>(cloned)) {
      if (decoded != nullptr) {
        // Adopt the retained Swift object into a shared_ptr that releases it via
        // CFBridgingRelease (an ObjC bridge call) when the last props clone is gone.
        expoProps->decodedProps = makeDecodedPropsHandle(decoded);
      } else {
        expoProps->propsMap = std::move(propsMap);
      }
    } else if (decoded != nullptr) {
      // Couldn't attach it; release to avoid leaking the retained Swift object.
      makeDecodedPropsHandle(decoded);
    }
    return cloned;
  }
};

} // namespace expo

#endif // __cplusplus
