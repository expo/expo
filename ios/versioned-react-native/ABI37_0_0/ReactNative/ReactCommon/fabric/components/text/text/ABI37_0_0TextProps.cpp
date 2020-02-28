/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0TextProps.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

TextProps::TextProps(const TextProps &sourceProps, const RawProps &rawProps)
    : BaseTextProps::BaseTextProps(sourceProps, rawProps){};

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
