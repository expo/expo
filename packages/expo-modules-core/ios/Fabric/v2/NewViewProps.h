// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>

#include "NewPropsDecoder.h"

namespace expo::views {

/**
 The props of a view of Expo Modules v2: the base view props that React Native parses
 (layout, style, accessibility) and the view's own props, decoded by its `NewPropsDecoder`.
 */
class NewViewProps final : public facebook::react::ViewProps {
public:
  NewViewProps() = default;

  /**
   Parses only the base view props and keeps the decoded props of `sourceProps`. Before React Native 0.87,
   React Native uses it to collect the keys of the base view props (`RawPropsParser::prepare`), and
   `NewComponentDescriptor` uses the constructor that takes the decoded props. Since React Native 0.87,
   `NewComponentDescriptor` copies the source props and sets the props of the update with `setProp`.
   */
  NewViewProps(
    const facebook::react::PropsParserContext &context,
    const NewViewProps &sourceProps,
    const facebook::react::RawProps &rawProps
  );

  NewViewProps(
    const facebook::react::PropsParserContext &context,
    const NewViewProps &sourceProps,
    const facebook::react::RawProps &rawProps,
    DecodedProps decodedProps
  );

  /**
   The view's own props, or `nullptr` when nothing was decoded yet and all props have their defaults.
   Not `const`, so `NewComponentDescriptor` can set it on a copy of the source props. It's written only
   before the props are shared.
   */
  DecodedProps decodedProps;
};

} // namespace expo::views

#if REACT_NATIVE_TARGET_VERSION >= 87
namespace facebook::react {

/**
 `ConcreteComponentDescriptor` prepares a `RawPropsParser` for each descriptor, which collects the keys of all base
 view props. It costs more than the rest of registering a view, and every new descriptor registry does it again.
 `NewComponentDescriptor::cloneProps` doesn't use the parser since React Native 0.87, so the parser of `NewViewProps`
 isn't prepared.
 */
template <>
inline void RawPropsParser::prepare<expo::views::NewViewProps>() noexcept {}

} // namespace facebook::react
#endif

#endif // __cplusplus
