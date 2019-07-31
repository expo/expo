/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0components/view/ViewProps.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutConstraints.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutContext.h>

namespace facebook {
namespace ReactABI31_0_0 {

class RootProps;

using SharedRootProps = std::shared_ptr<const RootProps>;

class RootProps final:
  public ViewProps {

public:
  RootProps() = default;
  RootProps(
    const RootProps &sourceProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext
  );

#pragma mark - Props

  const LayoutConstraints layoutConstraints {};
  const LayoutContext layoutContext {};
};

} // namespace ReactABI31_0_0
} // namespace facebook
