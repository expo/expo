/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI49_0_0React/ABI49_0_0renderer/components/unimplementedview/UnimplementedViewProps.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

void UnimplementedViewProps::setComponentName(ComponentName componentName) {
  componentName_ = componentName;
}

ComponentName UnimplementedViewProps::getComponentName() const {
  return componentName_;
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
