/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0Props.h"

#include <folly/dynamic.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/propsConversions.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

Props::Props(
    const PropsParserContext &context,
    const Props &sourceProps,
    const RawProps &rawProps,
    const bool shouldSetRawProps)
    : nativeId(convertRawProp(
          context,
          rawProps,
          "nativeID",
          sourceProps.nativeId,
          {})),
      revision(sourceProps.revision + 1)
#ifdef ANDROID
      ,
      rawProps(
          shouldSetRawProps ? (folly::dynamic)rawProps
                            : /* null */ folly::dynamic())
#endif
          {};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
