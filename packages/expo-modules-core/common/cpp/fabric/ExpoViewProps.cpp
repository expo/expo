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
  [[maybe_unused]] const std::function<bool(const std::string &)> &filterObjectKeys
)
#if EXPO_VIEW_PROPS_SUPPORTS_FILTER_OBJECT_KEYS
  : react::ViewProps(context, sourceProps, rawProps, filterObjectKeys),
#else
  : react::ViewProps(context, sourceProps, rawProps),
#endif
    propsMap(propsMapFromProps(sourceProps, rawProps)) {}

} // namespace expo
