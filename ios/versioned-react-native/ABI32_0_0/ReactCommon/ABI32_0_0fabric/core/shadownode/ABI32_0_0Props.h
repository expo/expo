/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

#include <ABI32_0_0fabric/ABI32_0_0core/Sealable.h>
#include <ABI32_0_0fabric/ABI32_0_0core/ReactABI32_0_0Primitives.h>
#include <ABI32_0_0fabric/ABI32_0_0debug/DebugStringConvertible.h>

namespace facebook {
namespace ReactABI32_0_0 {

class Props;

using SharedProps = std::shared_ptr<const Props>;

/*
 * Represents the most generic props object.
 */
class Props:
  public virtual Sealable,
  public virtual DebugStringConvertible {

public:
  Props() = default;
  Props(const Props &sourceProps, const RawProps &rawProps);

  const std::string nativeId;
};

} // namespace ReactABI32_0_0
} // namespace facebook
