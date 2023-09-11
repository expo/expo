/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/PropsParserContext.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/RawProps.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/ColorComponents.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

inline ColorComponents parsePlatformColor(
    const PropsParserContext &context,
    const RawValue &value) {
  float alpha = 0;
  float red = 0;
  float green = 0;
  float blue = 0;

  return {red, green, blue, alpha};
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
