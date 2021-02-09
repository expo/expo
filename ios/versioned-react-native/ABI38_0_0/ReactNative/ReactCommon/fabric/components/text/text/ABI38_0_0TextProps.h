/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI38_0_0React/attributedstring/TextAttributes.h>
#include <ABI38_0_0React/components/text/BaseTextProps.h>
#include <ABI38_0_0React/core/Props.h>
#include <ABI38_0_0React/graphics/Color.h>
#include <ABI38_0_0React/graphics/Geometry.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

class TextProps : public Props, public BaseTextProps {
 public:
  TextProps() = default;
  TextProps(const TextProps &sourceProps, const RawProps &rawProps);

#pragma mark - DebugStringConvertible

#if ABI38_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
