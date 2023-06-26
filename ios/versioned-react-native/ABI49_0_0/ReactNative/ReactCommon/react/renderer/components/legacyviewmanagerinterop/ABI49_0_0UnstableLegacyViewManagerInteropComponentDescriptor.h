/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteComponentDescriptor.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Descriptor for <UnstableABI49_0_0ReactLegacyComponent> component.
 *
 * This component is part of the Fabric Interop Layer and is subject to future
 * changes (hence the "Unstable" prefix).
 */
template <const char *concreteComponentName>
class UnstableLegacyViewManagerInteropComponentDescriptor
    : public ConcreteComponentDescriptor<
          ConcreteViewShadowNode<concreteComponentName, ViewProps>> {
 public:
  UnstableLegacyViewManagerInteropComponentDescriptor<concreteComponentName>(
      ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<
            ConcreteViewShadowNode<concreteComponentName, ViewProps>>(
            parameters) {}

 private:
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
