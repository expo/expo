/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/Props.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Color.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Geometry.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * `Props`-like class which is used as a base class for all Props classes
 * that can have text attributes (such as Text and Paragraph).
 */
class BaseTextProps {
 public:
  BaseTextProps() = default;
  BaseTextProps(const BaseTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  TextAttributes textAttributes{};

#pragma mark - DebugStringConvertible (partially)

#if ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
