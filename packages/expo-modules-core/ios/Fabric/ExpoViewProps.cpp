// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"
#include <react/renderer/core/propsConversions.h>

namespace expo {

ExpoViewProps::ExpoViewProps(const react::PropsParserContext &context,
                             const ExpoViewProps &sourceProps,
                             const react::RawProps &rawProps)
                             : ViewProps(context, sourceProps, rawProps),
                               proxiedProperties(
                                 facebook::react::convertRawProp(context, rawProps, "proxiedProperties", sourceProps.proxiedProperties, {})) {
}

} // namespace expo
