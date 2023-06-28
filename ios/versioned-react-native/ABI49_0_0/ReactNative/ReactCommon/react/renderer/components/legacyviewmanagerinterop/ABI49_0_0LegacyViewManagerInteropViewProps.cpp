/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0LegacyViewManagerInteropViewProps.h"
#include <ABI49_0_0React/renderer/core/ABI49_0_0DynamicPropsUtilities.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const PropsParserContext &context,
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      otherProps(
          mergeDynamicProps(sourceProps.otherProps, (folly::dynamic)rawProps)) {
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
