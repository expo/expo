/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <unordered_map>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class LegacyViewManagerInteropViewProps final : public ViewProps {
 public:
  LegacyViewManagerInteropViewProps() = default;
  LegacyViewManagerInteropViewProps(
      const PropsParserContext &context,
      const LegacyViewManagerInteropViewProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  folly::dynamic const otherProps;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
