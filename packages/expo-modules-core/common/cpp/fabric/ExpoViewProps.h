// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <folly/dynamic.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>

namespace expo {

class ExpoViewProps final : public facebook::react::ViewProps {
public:
  ExpoViewProps() = default;
  ExpoViewProps(const facebook::react::PropsParserContext &context,
                const ExpoViewProps &sourceProps,
                const facebook::react::RawProps &rawProps);

#pragma mark - Props

  /**
   A map with props stored as `folly::dynamic` objects.
   */
  std::unordered_map<std::string, folly::dynamic> propsMap;
};

} // namespace expo

#endif // __cplusplus
