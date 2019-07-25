/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ReactABI34_0_0/core/Props.h>
#include <ReactABI34_0_0/debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI34_0_0 {

class RawTextProps;

using SharedRawTextProps = std::shared_ptr<const RawTextProps>;

class RawTextProps : public Props {
 public:
  RawTextProps() = default;
  RawTextProps(const RawTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const std::string text{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ReactABI34_0_0
} // namespace facebook
