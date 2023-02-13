/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutConstraints.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutContext.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(
      const PropsParserContext &context,
      RootProps const &sourceProps,
      RawProps const &rawProps);
  RootProps(
      const PropsParserContext &context,
      RootProps const &sourceProps,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext);

#pragma mark - Props

  LayoutConstraints layoutConstraints{};
  LayoutContext layoutContext{};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
