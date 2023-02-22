/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0PropsMapBuffer.h"
#include "ABI48_0_0Props.h"

#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBufferBuilder.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

#ifdef ANDROID
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
#endif

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
