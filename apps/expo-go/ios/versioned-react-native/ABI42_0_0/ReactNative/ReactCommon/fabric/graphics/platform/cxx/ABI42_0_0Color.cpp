/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0Color.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

SharedColor colorFromComponents(ColorComponents components) {
  float ratio = 255.9999;
  return SharedColor(
      ((int)(components.alpha * ratio) & 0xff) << 24 |
      ((int)(components.red * ratio) & 0xff) << 16 |
      ((int)(components.green * ratio) & 0xff) << 8 |
      ((int)(components.blue * ratio) & 0xff));
}

ColorComponents colorComponentsFromColor(SharedColor sharedColor) {
  float ratio = 256;
  Color color = *sharedColor;
  return ColorComponents{(float)((color >> 16) & 0xff) / ratio,
                         (float)((color >> 8) & 0xff) / ratio,
                         (float)((color >> 0) & 0xff) / ratio,
                         (float)((color >> 24) & 0xff) / ratio};
}

SharedColor clearColor() {
  static SharedColor color = colorFromComponents(ColorComponents{0, 0, 0, 0});
  return color;
}

SharedColor blackColor() {
  static SharedColor color = colorFromComponents(ColorComponents{0, 0, 0, 1});
  return color;
}

SharedColor whiteColor() {
  static SharedColor color = colorFromComponents(ColorComponents{1, 1, 1, 1});
  return color;
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
