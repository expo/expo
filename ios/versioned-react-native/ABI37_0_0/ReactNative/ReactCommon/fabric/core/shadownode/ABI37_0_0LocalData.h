/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI37_0_0React/core/Sealable.h>
#include <ABI37_0_0React/debug/DebugStringConvertible.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class LocalData;

using SharedLocalData = std::shared_ptr<const LocalData>;

/*
 * Abstract class for any kind of concrete pieces of local data specific for
 * some kinds of `ShadowNode`s.
 * LocalData might be used to communicate some information between `ShadowNode`s
 * and native component views.
 * All `LocalData` objects *must* be immutable (sealed) when they became
 * a part of the shadow tree.
 */
class LocalData : public Sealable, public DebugStringConvertible {
 public:
  using Shared = std::shared_ptr<LocalData const>;

  virtual ~LocalData() = default;

  virtual folly::dynamic getDynamic() const {
    return folly::dynamic::object();
  }
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
