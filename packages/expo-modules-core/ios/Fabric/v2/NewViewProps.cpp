// Copyright 2026-present 650 Industries. All rights reserved.

#include "NewViewProps.h"

#include <utility>

namespace react = facebook::react;

namespace expo::views {

NewViewProps::NewViewProps(
  const react::PropsParserContext &context,
  const NewViewProps &sourceProps,
  const react::RawProps &rawProps
) : react::ViewProps(context, sourceProps, rawProps),
    decodedProps(sourceProps.decodedProps) {}

NewViewProps::NewViewProps(
  const react::PropsParserContext &context,
  const NewViewProps &sourceProps,
  const react::RawProps &rawProps,
  DecodedProps decodedProps
) : react::ViewProps(context, sourceProps, rawProps),
    decodedProps(std::move(decodedProps)) {}

} // namespace expo::views
