/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/attributedstring/TextAttributes.h>
#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/graphics/Color.h>
#include <ReactABI34_0_0/graphics/Geometry.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * `Props`-like class which is used as a base class for all Props classes
 * that can have text attributes (such as Text and Paragraph).
 */
class BaseTextProps {
 public:
  BaseTextProps() = default;
  BaseTextProps(const BaseTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const TextAttributes textAttributes{};

#pragma mark - DebugStringConvertible (partially)

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
