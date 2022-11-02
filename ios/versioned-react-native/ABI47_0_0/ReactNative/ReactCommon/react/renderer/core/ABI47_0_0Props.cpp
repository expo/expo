/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0Props.h"

#include <folly/dynamic.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/propsConversions.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

bool Props::enablePropIteratorSetter = false;

Props::Props(
    const PropsParserContext &context,
    const Props &sourceProps,
    const RawProps &rawProps,
    const bool shouldSetRawProps)
    : nativeId(
          enablePropIteratorSetter ? sourceProps.nativeId
                                   : convertRawProp(
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
{
}

void Props::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  switch (hash) {
    case CONSTEXPR_RAW_PROPS_KEY_HASH("nativeID"):
      fromRawValue(context, value, nativeId, {});
      return;
  }
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
