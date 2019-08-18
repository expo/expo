/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0yoga/ABI31_0_0YGStyle.h>

#include <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI31_0_0 {

class YogaStylableProps;

typedef std::shared_ptr<const YogaStylableProps> SharedYogaStylableProps;

class YogaStylableProps {

public:

  YogaStylableProps() = default;
  YogaStylableProps(const ABI31_0_0YGStyle &yogaStyle);
  YogaStylableProps(const YogaStylableProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const ABI31_0_0YGStyle yogaStyle {};

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;
};

} // namespace ReactABI31_0_0
} // namespace facebook
