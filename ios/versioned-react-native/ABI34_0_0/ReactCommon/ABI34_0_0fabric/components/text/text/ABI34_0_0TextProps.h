/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/attributedstring/TextAttributes.h>
#include <ReactABI34_0_0/components/text/BaseTextProps.h>
#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/graphics/Color.h>
#include <ReactABI34_0_0/graphics/Geometry.h>

namespace facebook {
namespace ReactABI34_0_0 {

class TextProps : public Props, public BaseTextProps {
 public:
  TextProps() = default;
  TextProps(const TextProps &sourceProps, const RawProps &rawProps);

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
