/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI32_0_0RawTextProps.h"

#include <ABI32_0_0fabric/ABI32_0_0core/propsConversions.h>
#include <ABI32_0_0fabric/ABI32_0_0debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI32_0_0 {

RawTextProps::RawTextProps(const RawTextProps &sourceProps, const RawProps &rawProps):
  Props(sourceProps, rawProps),
  text(convertRawProp(rawProps, "text", sourceProps.text)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return {
    debugStringConvertibleItem("text", text)
  };
}

} // namespace ReactABI32_0_0
} // namespace facebook
