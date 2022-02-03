/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI42_0_0AndroidSwitchMeasurementsManager.h"

#include <ABI42_0_0React/components/rncore/EventEmitters.h>
#include <ABI42_0_0React/components/rncore/Props.h>
#include <ABI42_0_0React/components/view/ConcreteViewShadowNode.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

extern const char AndroidSwitchComponentName[];

/*
 * `ShadowNode` for <AndroidSwitch> component.
 */
class AndroidSwitchShadowNode final : public ConcreteViewShadowNode<
                                          AndroidSwitchComponentName,
                                          AndroidSwitchProps,
                                          AndroidSwitchEventEmitter> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  // Associates a shared `AndroidSwitchMeasurementsManager` with the node.
  void setAndroidSwitchMeasurementsManager(
      const std::shared_ptr<AndroidSwitchMeasurementsManager>
          &measurementsManager);

#pragma mark - LayoutableShadowNode

  Size measure(LayoutConstraints layoutConstraints) const override;

 private:
  std::shared_ptr<AndroidSwitchMeasurementsManager> measurementsManager_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
