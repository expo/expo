// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"
#include <react/renderer/core/propsConversions.h>

namespace react = facebook::react;

namespace expo {

/**
 Borrows the props map from the source props and applies the update given in the raw props.
 */
std::unordered_map<std::string, folly::dynamic> propsMapFromProps(const ExpoViewProps &sourceProps, const react::RawProps &rawProps) {
  // Move the contents of the source props map – the source props instance will not be used anymore.
  std::unordered_map<std::string, folly::dynamic> propsMap = std::move(sourceProps.propsMap);

  // Iterate over values in the raw props object.
  // Note that it contains only updated props.
  rawProps.iterateOverValues([&propsMap](react::RawPropsPropNameHash hash, const char *name, const react::RawValue &value) {
    std::string propName(name);
    propsMap[propName] = (folly::dynamic)value;
  });

  return propsMap;
}

ExpoViewProps::ExpoViewProps(const react::PropsParserContext &context,
                             const ExpoViewProps &sourceProps,
                             const react::RawProps &rawProps)
                             : ViewProps(context, sourceProps, rawProps),
                               propsMap(propsMapFromProps(sourceProps, rawProps)) {}

} // namespace expo
