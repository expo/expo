// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <folly/dynamic.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>

#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

// macOS ViewProps doesn't support filterObjectKeys parameter
#if defined(TARGET_OS_OSX) && TARGET_OS_OSX
#define EXPO_VIEW_PROPS_SUPPORTS_FILTER_OBJECT_KEYS 0
#else
#define EXPO_VIEW_PROPS_SUPPORTS_FILTER_OBJECT_KEYS 1
#endif

namespace expo {

class ExpoViewProps : public facebook::react::ViewProps {
public:
  ExpoViewProps() = default;

  ExpoViewProps(
    const facebook::react::PropsParserContext &context,
    const ExpoViewProps &sourceProps,
    const facebook::react::RawProps &rawProps,
    const std::function<bool(const std::string &)> &filterObjectKeys = nullptr
  );

protected:
  /**
   Designated constructor. When `buildPropsMap` is `false`, the `folly::dynamic` lowering into
   `propsMap` is skipped. Used by `ExpoJSIViewProps`, which decodes props straight from their
   JavaScript values and never reads `propsMap`. The public constructor builds it (the classic
   `folly::dynamic` path used by SwiftUI and Android).
   */
  ExpoViewProps(
    const facebook::react::PropsParserContext &context,
    const ExpoViewProps &sourceProps,
    const facebook::react::RawProps &rawProps,
    const std::function<bool(const std::string &)> &filterObjectKeys,
    bool buildPropsMap
  );

public:
#pragma mark - Props

  /**
   Typed prop read by `ExpoViewShadowNode` during layout to decide view flattening. Parsed as a
   first-class `bool` (via `convertRawProp`) rather than looked up in `propsMap`, so the shadow
   node doesn't depend on `propsMap` being materialized.
   */
  bool disableForceFlatten = false;

  /**
   A map with props stored as `folly::dynamic` objects.

   `mutable` because the JSI component descriptor populates it in `cloneProps` after the props
   object is already held as `const`, for views that fall back to the dictionary path.
   */
  mutable std::unordered_map<std::string, folly::dynamic> propsMap;
};

/**
 Borrows the props map from the source props and applies the update given in the raw props.
 */
std::unordered_map<std::string, folly::dynamic> propsMapFromProps(
  const ExpoViewProps &sourceProps,
  const facebook::react::RawProps &rawProps
);

} // namespace expo

#endif // __cplusplus
