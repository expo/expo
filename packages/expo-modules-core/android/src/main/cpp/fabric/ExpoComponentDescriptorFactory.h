// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <react/renderer/core/ComponentDescriptor.h>
#include "ExpoViewComponentRegistry.h"

namespace react = facebook::react;

namespace expo {

ExpoViewComponentRegistry &getExpoViewComponentRegistry();

react::ComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
);

} // namespace expo
