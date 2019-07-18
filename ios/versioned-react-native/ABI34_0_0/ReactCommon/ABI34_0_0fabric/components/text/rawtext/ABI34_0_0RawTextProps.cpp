/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0RawTextProps.h"

#include <ReactABI34_0_0/core/propsConversions.h>
#include <ReactABI34_0_0/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI34_0_0 {

RawTextProps::RawTextProps(
    const RawTextProps &sourceProps,
    const RawProps &rawProps)
    : Props(sourceProps, rawProps),
      text(convertRawProp(rawProps, "text", sourceProps.text)){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return {debugStringConvertibleItem("text", text)};
}
#endif

} // namespace ReactABI34_0_0
} // namespace facebook
