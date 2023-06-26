/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0Props.h"
#include "ABI49_0_0PropsMapBuffer.h"

#include <folly/dynamic.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0CoreFeatures.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0propsConversions.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

Props::Props(
    const PropsParserContext &context,
    const Props &sourceProps,
    const RawProps &rawProps,
    const bool shouldSetRawProps)
    : nativeId(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.nativeId
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "nativeID",
                                                       sourceProps.nativeId,
                                                       {}))
#ifdef ANDROID
      ,
      rawProps(
          shouldSetRawProps ? (folly::dynamic)rawProps
                            : /* null */ folly::dynamic())
#endif
{
}

void Props::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char * /*propName*/,
    RawValue const &value) {
  switch (hash) {
    case CONSTEXPR_RAW_PROPS_KEY_HASH("nativeID"):
      fromRawValue(context, value, nativeId, {});
      return;
  }
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
