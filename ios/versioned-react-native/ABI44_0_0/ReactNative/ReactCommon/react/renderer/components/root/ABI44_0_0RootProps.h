/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI44_0_0React/ABI44_0_0renderer/components/view/ViewProps.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/LayoutConstraints.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/LayoutContext.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(RootProps const &sourceProps, RawProps const &rawProps);
  RootProps(
      RootProps const &sourceProps,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext);

#pragma mark - Props

  LayoutConstraints layoutConstraints{};
  LayoutContext layoutContext{};
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
