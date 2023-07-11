/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0RawProps.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0ColorComponents.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

inline ColorComponents parsePlatformColor(
    const PropsParserContext &context,
    const RawValue &value) {
  float alpha = 0;
  float red = 0;
  float green = 0;
  float blue = 0;

  return {red, green, blue, alpha};
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
