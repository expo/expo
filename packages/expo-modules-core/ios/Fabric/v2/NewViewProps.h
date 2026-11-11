// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>

#include "NewPropsDecoder.h"

namespace expo::views {

/**
 The props of a view of the Expo Modules API 2.0: the base view props that React Native parses
 (layout, style, accessibility) and the view's own props, decoded by its `NewPropsDecoder`.
 */
class NewViewProps final : public facebook::react::ViewProps {
public:
  NewViewProps() = default;

  /**
   Parses only the base view props and keeps the decoded props of `sourceProps`. React Native uses it
   to collect the keys of the base view props (`RawPropsParser::prepare`).
   `NewComponentDescriptor` uses the constructor that takes the decoded props.
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
   */
  const DecodedProps decodedProps;
};

} // namespace expo::views

#endif // __cplusplus
