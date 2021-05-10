/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI39_0_0LegacyViewManagerInteropViewProps.h"

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps), otherProps((folly::dynamic)rawProps) {}

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
