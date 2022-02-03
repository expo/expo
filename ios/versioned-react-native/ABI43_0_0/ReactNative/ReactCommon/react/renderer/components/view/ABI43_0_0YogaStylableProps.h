/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0yoga/ABI43_0_0YGStyle.h>

#include <ABI43_0_0React/ABI43_0_0renderer/core/Props.h>
#include <ABI43_0_0React/ABI43_0_0renderer/debug/DebugStringConvertible.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  ABI43_0_0YGStyle yogaStyle{};

#if RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
