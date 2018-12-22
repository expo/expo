/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI32_0_0yoga/ABI32_0_0YGStyle.h>

#include <ABI32_0_0fabric/ABI32_0_0core/Props.h>
#include <ABI32_0_0fabric/ABI32_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI32_0_0 {

class YogaStylableProps;

typedef std::shared_ptr<const YogaStylableProps> SharedYogaStylableProps;

class YogaStylableProps {

public:

  YogaStylableProps() = default;
  YogaStylableProps(const ABI32_0_0YGStyle &yogaStyle);
  YogaStylableProps(const YogaStylableProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const ABI32_0_0YGStyle yogaStyle {};

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;
};

} // namespace ReactABI32_0_0
} // namespace facebook
