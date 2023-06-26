/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * It's a normal `ViewProps` with additional information about the component
 * name which is being updated manually in `ComponentDescriptor`.
 */
class UnimplementedViewProps final : public ViewProps {
 public:
  using ViewProps::ViewProps;

  /*
   * Should be called from a `ComponentDescriptor` to store information about
   * the name of a particular component.
   */
  void setComponentName(ComponentName componentName);
  ComponentName getComponentName() const;

 private:
  mutable ComponentName componentName_{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
