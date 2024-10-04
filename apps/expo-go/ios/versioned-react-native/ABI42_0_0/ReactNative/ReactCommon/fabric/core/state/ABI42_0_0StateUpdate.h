/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <ABI42_0_0React/core/StateData.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class ShadowNodeFamily;
using SharedShadowNodeFamily = std::shared_ptr<ShadowNodeFamily const>;

class StateUpdate {
 public:
  using Callback =
      std::function<StateData::Shared(StateData::Shared const &data)>;

  SharedShadowNodeFamily family;
  Callback callback;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
