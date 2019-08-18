// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0core/ComponentDescriptor.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ComponentDescriptorRegistry;

using SharedComponentDescriptorRegistry = std::shared_ptr<const ComponentDescriptorRegistry>;

/*
 * Registry of particular `ComponentDescriptor`s.
 */
class ComponentDescriptorRegistry {

public:
  void registerComponentDescriptor(SharedComponentDescriptor componentDescriptor);

  const SharedComponentDescriptor operator[](const SharedShadowNode &shadowNode) const;
  const SharedComponentDescriptor operator[](const ComponentName &componentName) const;

private:
  std::unordered_map<ComponentHandle, SharedComponentDescriptor> _registryByHandle;
  std::unordered_map<ComponentName, SharedComponentDescriptor> _registryByName;
};

} // namespace ReactABI31_0_0
} // namespace facebook
