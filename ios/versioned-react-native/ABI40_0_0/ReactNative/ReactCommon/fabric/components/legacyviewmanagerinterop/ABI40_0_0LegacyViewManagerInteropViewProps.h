/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <ABI40_0_0React/components/view/ViewProps.h>
#include <unordered_map>

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

class LegacyViewManagerInteropViewProps final : public ViewProps {
 public:
  LegacyViewManagerInteropViewProps() = default;
  LegacyViewManagerInteropViewProps(
      const LegacyViewManagerInteropViewProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  folly::dynamic const otherProps;
};

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
