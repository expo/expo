/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/core/EventEmitter.h>
#include <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Note: All of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them nor
 * retain ownership of them.
 */
class ShadowNodeFamilyFragment final {
 public:
  Tag const tag;
  SurfaceId const surfaceId;
  EventEmitter::Shared const &eventEmitter;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
