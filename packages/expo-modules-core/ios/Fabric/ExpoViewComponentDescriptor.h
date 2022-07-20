// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "ExpoViewShadowNode.h"

namespace expo {

class ExpoViewComponentDescriptor : public facebook::react::ConcreteComponentDescriptor<ExpoViewShadowNode> {
 public:
  ExpoViewComponentDescriptor(facebook::react::ComponentDescriptorParameters const &parameters)
    : facebook::react::ConcreteComponentDescriptor<ExpoViewShadowNode>(parameters) {}
};

} // namespace expo

#endif // __cplusplus
