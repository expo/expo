/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/TextAttributes.h>
#include <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Color.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>

namespace facebook {
namespace ReactABI31_0_0 {

/*
 * `Props`-like class which is used as a base class for all Props classes
 * that can have text attributes (such as Text and Paragraph).
 */
class BaseTextProps {
public:

  BaseTextProps() = default;
  BaseTextProps(const BaseTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const TextAttributes textAttributes {};

#pragma mark - DebugStringConvertible (partially)

  SharedDebugStringConvertibleList getDebugProps() const;
};

} // namespace ReactABI31_0_0
} // namespace facebook
