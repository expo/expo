/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0yoga/ABI42_0_0YGStyle.h>

#include <ABI42_0_0React/core/Props.h>
#include <ABI42_0_0React/debug/DebugStringConvertible.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  ABI42_0_0YGStyle yogaStyle{};

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
