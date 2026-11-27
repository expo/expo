// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <folly/dynamic.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawPropsParser.h>

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

#pragma mark - Props

  /**
   A map with props stored as `folly::dynamic` objects.
   */
  std::unordered_map<std::string, folly::dynamic> propsMap;
};

} // namespace expo

namespace facebook::react {

/**
 `ConcreteComponentDescriptor` prepares a `RawPropsParser` for each descriptor. It collects the keys of all base
 view props, which is O(n^2) in the number of keys and costs more than the rest of registering a view. Every view of
 Expo Modules v1 has the same props type, so the parser is prepared once and each descriptor gets a copy.
 */
template <>
inline void RawPropsParser::prepare<expo::ExpoViewProps>() noexcept
{
  static const RawPropsParser preparedParser = [] {
    RawPropsParser parser;
    RawProps emptyRawProps{};
    ContextContainer contextContainer{};
    PropsParserContext parserContext{-1, contextContainer};
    emptyRawProps.parse(parser);
    expo::ExpoViewProps(parserContext, {}, emptyRawProps);
    parser.postPrepare();
    return parser;
  }();
  *this = preparedParser;
}

} // namespace facebook::react

#endif // __cplusplus
