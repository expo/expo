/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI42_0_0React/components/unimplementedview/UnimplementedViewProps.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

void UnimplementedViewProps::setComponentName(ComponentName componentName) {
  componentName_ = componentName;
}

ComponentName UnimplementedViewProps::getComponentName() const {
  return componentName_;
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
