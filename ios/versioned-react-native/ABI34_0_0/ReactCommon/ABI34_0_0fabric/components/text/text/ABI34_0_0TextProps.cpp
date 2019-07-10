/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0TextProps.h"

namespace facebook {
namespace ReactABI34_0_0 {

TextProps::TextProps(const TextProps &sourceProps, const RawProps &rawProps)
    : BaseTextProps::BaseTextProps(sourceProps, rawProps){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

} // namespace ReactABI34_0_0
} // namespace facebook
