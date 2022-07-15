/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0ParagraphState.h"

#include <ABI46_0_0React/ABI46_0_0renderer/components/text/conversions.h>
#include <ABI46_0_0React/ABI46_0_0renderer/debug/debugStringConvertibleUtils.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

#ifdef ANDROID
folly::dynamic ParagraphState::getDynamic() const {
  return toDynamic(*this);
}

MapBuffer ParagraphState::getMapBuffer() const {
  return toMapBuffer(*this);
}
#endif

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
