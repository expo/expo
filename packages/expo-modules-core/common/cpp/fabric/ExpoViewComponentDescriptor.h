// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ShadowNode.h>

#include "ExpoViewShadowNode.h"

namespace expo {

class ExpoViewComponentDescriptor : public facebook::react::ConcreteComponentDescriptor<ExpoViewShadowNode> {
 public:
  using Flavor = std::shared_ptr<std::string const>;

  ExpoViewComponentDescriptor(facebook::react::ComponentDescriptorParameters const &parameters);

  facebook::react::ComponentHandle getComponentHandle() const override;
  facebook::react::ComponentName getComponentName() const override;

  void adopt(facebook::react::ShadowNode &shadowNode) const override;
};

} // namespace expo

#endif // __cplusplus
