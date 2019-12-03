/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI34_0_0yoga/ABI34_0_0YGStyle.h>

#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI34_0_0 {

class YogaStylableProps;

typedef std::shared_ptr<const YogaStylableProps> SharedYogaStylableProps;

class YogaStylableProps {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(const ABI34_0_0YGStyle &ABI34_0_0yogaStyle);
  YogaStylableProps(
      const YogaStylableProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const ABI34_0_0YGStyle ABI34_0_0yogaStyle{};

#pragma mark - DebugStringConvertible (Partial)

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
