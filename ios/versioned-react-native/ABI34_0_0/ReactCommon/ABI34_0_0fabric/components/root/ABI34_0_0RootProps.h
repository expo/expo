/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactABI34_0_0/components/view/ViewProps.h>
#include <ReactABI34_0_0/core/LayoutConstraints.h>
#include <ReactABI34_0_0/core/LayoutContext.h>

namespace facebook {
namespace ReactABI34_0_0 {

class RootProps;

using SharedRootProps = std::shared_ptr<const RootProps>;

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(
      const RootProps &sourceProps,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext);

#pragma mark - Props

  const LayoutConstraints layoutConstraints{};
  const LayoutContext layoutContext{};
};

} // namespace ReactABI34_0_0
} // namespace facebook
