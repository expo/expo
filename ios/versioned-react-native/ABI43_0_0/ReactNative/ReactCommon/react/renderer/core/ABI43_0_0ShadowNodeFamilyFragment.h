/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/EventEmitter.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class ShadowNodeFamily;

/*
 * Note: All of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them nor
 * retain ownership of them.
 */
class ShadowNodeFamilyFragment final {
 public:
  static ShadowNodeFamilyFragment build(ShadowNodeFamily const &family);

  Tag const tag;
  SurfaceId const surfaceId;
  EventEmitter::Shared const &eventEmitter;

  /*
   * `ShadowNodeFamilyFragment` is not owning data-structure, it only stores raw
   * pointers to the data. `ShadowNodeFamilyFragment::Value` is a convenient
   * owning counterpart of that.
   */
  class Value final {
   public:
    /*
     * Creates an object with given `ShadowNodeFragment`.
     */
    Value(ShadowNodeFamilyFragment const &fragment);

    /*
     * Creates a `ShadowNodeFragment` from the object.
     */
    explicit operator ShadowNodeFamilyFragment() const;

    Tag tag;
    SurfaceId surfaceId;
    EventEmitter::Shared eventEmitter;
  };
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
