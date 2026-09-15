// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/components/view/ViewProps.h>

namespace react = facebook::react;

namespace expo {

/**
 Borrows the props map from the source props and applies the update given in the raw props.
 */
std::unordered_map<std::string, folly::dynamic> propsMapFromProps(
  const ExpoViewProps &sourceProps,
  const react::RawProps &rawProps
) {
  std::unordered_map<std::string, folly::dynamic> propsMap = sourceProps.propsMap;

  // Iterate over values in the raw props object.
  // Note that it contains only updated props.
  const auto &dynamicRawProps = static_cast<folly::dynamic>(rawProps);
  for (const auto &propsPair: dynamicRawProps.items()) {
    const auto &propName = propsPair.first.getString();
    propsMap[propName] = static_cast<folly::dynamic>(propsPair.second);
  }

  return propsMap;
}

ExpoViewProps::ExpoViewProps(
  const react::PropsParserContext &context,
  const ExpoViewProps &sourceProps,
  const react::RawProps &rawProps,
  const std::function<bool(const std::string &)> &filterObjectKeys
) : ExpoViewProps(context, sourceProps, rawProps, filterObjectKeys, /* buildPropsMap */ true) {}

ExpoViewProps::ExpoViewProps(
  const react::PropsParserContext &context,
  const ExpoViewProps &sourceProps,
  const react::RawProps &rawProps,
  [[maybe_unused]] const std::function<bool(const std::string &)> &filterObjectKeys,
  bool buildPropsMap
)
#if EXPO_VIEW_PROPS_SUPPORTS_FILTER_OBJECT_KEYS
  : react::ViewProps(context, sourceProps, rawProps, filterObjectKeys)
#else
  : react::ViewProps(context, sourceProps, rawProps)
#endif
{
  if (buildPropsMap) {
    // Legacy path: lower the raw props into `propsMap` (via the dynamic representation) and read
    // `disableForceFlatten` from there. We must not also parse it with `convertRawProp` below,
    // because the parser path and the `folly::dynamic` cast can't both consume the same `RawProps`.
    propsMap = propsMapFromProps(sourceProps, rawProps);

    const auto it = propsMap.find("disableForceFlatten");
    disableForceFlatten = (it != propsMap.end()) && it->second.isBool() && it->second.getBool();
  } else {
    // JSI path: there's no `propsMap`, so parse `disableForceFlatten` straight from the raw props.
    disableForceFlatten = react::convertRawProp(
      context, rawProps, "disableForceFlatten", sourceProps.disableForceFlatten, false);
  }
}

} // namespace expo
