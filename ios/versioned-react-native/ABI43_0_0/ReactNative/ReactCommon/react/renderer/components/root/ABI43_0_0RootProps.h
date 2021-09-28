/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewProps.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutContext.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
