// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"
#include <react/renderer/core/propsConversions.h>

namespace ABI47_0_0expo {

ExpoViewProps::ExpoViewProps(const react::PropsParserContext &context,
                             const ExpoViewProps &sourceProps,
                             const react::RawProps &rawProps)
                             : ViewProps(context, sourceProps, rawProps),
                               proxiedProperties(
                                 ABI47_0_0facebook::ABI47_0_0React::convertRawProp(context, rawProps, "proxiedProperties", sourceProps.proxiedProperties, {})) {
}

} // namespace ABI47_0_0expo
