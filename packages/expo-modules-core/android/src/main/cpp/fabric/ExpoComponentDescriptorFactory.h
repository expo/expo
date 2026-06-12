// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <react/renderer/core/ComponentDescriptor.h>
#include "../types/FrontendConverter.h"

namespace react = facebook::react;

namespace expo {

using StatePropMapType = std::unordered_map<
  react::ComponentDescriptor::Flavor,
  std::unordered_map<std::string, std::shared_ptr<FrontendConverter>>
>;

extern StatePropMapType statePropMap;

react::ComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
);

} // namespace expo
