/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0yoga/ABI37_0_0YGStyle.h>

#include <ABI37_0_0React/core/Props.h>
#include <ABI37_0_0React/debug/DebugStringConvertible.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class YogaStylableProps {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(ABI37_0_0YGStyle const &yogaStyle);
  YogaStylableProps(
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

 protected:
  friend class YogaLayoutableShadowNode;
  ABI37_0_0YGStyle const yogaStyle{};

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

 public:
  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
