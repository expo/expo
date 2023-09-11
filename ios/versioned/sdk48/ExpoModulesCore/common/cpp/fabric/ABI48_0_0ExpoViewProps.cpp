// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"
#include <react/renderer/core/propsConversions.h>

namespace react = ABI48_0_0facebook::ABI48_0_0React;

namespace ABI48_0_0expo {

ExpoViewProps::ExpoViewProps(const react::PropsParserContext &context,
                             const ExpoViewProps &sourceProps,
                             const react::RawProps &rawProps)
                             : ViewProps(context, sourceProps, rawProps),
                               proxiedProperties(
                                 ABI48_0_0facebook::ABI48_0_0React::convertRawProp(context, rawProps, "proxiedProperties", sourceProps.proxiedProperties, {})) {
}

} // namespace ABI48_0_0expo
