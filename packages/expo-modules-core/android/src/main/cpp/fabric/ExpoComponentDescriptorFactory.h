// Copyright 2018-present 650 Industries. All rights reserved.

#pragma once

#include <react/renderer/core/ComponentDescriptor.h>
#include "../types/FrontendConverter.h"

#include <shared_mutex>

namespace react = facebook::react;

namespace expo {

using StatePropMapType = std::unordered_map<
  react::ComponentDescriptor::Flavor,
  std::unordered_map<std::string, std::shared_ptr<FrontendConverter>>
>;

extern StatePropMapType statePropMap;

// Guards `statePropMap`. It is written when Expo registers its view components and read
// when React Native builds a component descriptor registry, and these can run on different threads.
extern std::shared_mutex statePropMapMutex;

react::ComponentDescriptor::Unique concreteExpoComponentDescriptorConstructor(
  const react::ComponentDescriptorParameters &parameters
);

} // namespace expo
