/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI37_0_0React/components/view/ViewProps.h>
#include <ABI37_0_0React/core/LayoutConstraints.h>
#include <ABI37_0_0React/core/LayoutContext.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(RootProps const &sourceProps, RawProps const &rawProps);
  RootProps(
      RootProps const &sourceProps,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext);

#pragma mark - Props

  LayoutConstraints const layoutConstraints{};
  LayoutContext const layoutContext{};
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
