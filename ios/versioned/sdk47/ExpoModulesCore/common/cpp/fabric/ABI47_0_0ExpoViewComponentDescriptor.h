// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "ExpoViewShadowNode.h"

namespace ABI47_0_0expo {

class ExpoViewComponentDescriptor : public ABI47_0_0facebook::ABI47_0_0React::ConcreteComponentDescriptor<ExpoViewShadowNode> {
 public:
  using Flavor = std::shared_ptr<std::string const>;

  ExpoViewComponentDescriptor(ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorParameters const &parameters);

  ABI47_0_0facebook::ABI47_0_0React::ComponentHandle getComponentHandle() const override;
  ABI47_0_0facebook::ABI47_0_0React::ComponentName getComponentName() const override;
};

} // namespace ABI47_0_0expo

#endif // __cplusplus
