// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <ExpoModulesCore/ExpoViewProps.h>

namespace expo {

/**
 An `ExpoViewProps` derived class specific for SwiftUI that disables `collapsableChildren` by default
 */
class SwiftUIViewProps final : public ExpoViewProps {
public:
  SwiftUIViewProps() : ExpoViewProps() {
    this->collapsableChildren = false;
  }

  SwiftUIViewProps(const facebook::react::PropsParserContext &context,
                       const ExpoViewProps &sourceProps,
                       const facebook::react::RawProps &rawProps)
      : ExpoViewProps(context, sourceProps, rawProps) {
    this->collapsableChildren = false;
  }
};

} // namespace expo

#endif // __cplusplus
