/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0LegacyViewManagerInteropViewProps.h"
#include <ABI47_0_0React/ABI47_0_0renderer/core/DynamicPropsUtilities.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const PropsParserContext &context,
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      otherProps(
          mergeDynamicProps(sourceProps.otherProps, (folly::dynamic)rawProps)) {
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
