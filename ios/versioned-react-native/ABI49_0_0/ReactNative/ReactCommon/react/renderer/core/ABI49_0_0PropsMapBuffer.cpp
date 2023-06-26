/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0PropsMapBuffer.h"
#include "ABI49_0_0Props.h"

#ifdef ANDROID

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

void Props::propsDiffMapBuffer(
    Props const *oldPropsPtr,
    MapBufferBuilder &builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    Props defaultProps{};
    propsDiffMapBuffer(&defaultProps, builder);
    return;
  }

  Props const &oldProps = *oldPropsPtr;
  Props const &newProps = *this;

  if (oldProps.nativeId != newProps.nativeId) {
    builder.putString(PROPS_NATIVE_ID, nativeId);
  }
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
#endif
