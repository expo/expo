/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI31_0_0 {

class RawTextProps;

using SharedRawTextProps = std::shared_ptr<const RawTextProps>;

class RawTextProps:
  public Props {

public:
  RawTextProps() = default;
  RawTextProps(const RawTextProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const std::string text {};

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace ReactABI31_0_0
} // namespace facebook
