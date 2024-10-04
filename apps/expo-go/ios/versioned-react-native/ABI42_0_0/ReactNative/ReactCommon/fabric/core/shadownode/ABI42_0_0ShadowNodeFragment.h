/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/core/EventEmitter.h>
#include <ABI42_0_0React/core/Props.h>
#include <ABI42_0_0React/core/ABI42_0_0ReactPrimitives.h>
#include <ABI42_0_0React/core/ShadowNode.h>
#include <ABI42_0_0React/core/State.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * An object which supposed to be used as a parameter specifying a shape
 * of created or cloned ShadowNode.
 * Note: Most of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them nor
 * retain ownership of them.
 * Use `ShadowNodeFragment::Value` (see below) to create an owning copy of the
 * fragment content to store or pass the data asynchronously.
 */
struct ShadowNodeFragment {
  Props::Shared const &props = propsPlaceholder();
  ShadowNode::SharedListOfShared const &children = childrenPlaceholder();
  State::Shared const &state = statePlaceholder();

  /*
   * Placeholders.
   * Use as default arguments as an indication that the field does not need to
   * be changed.
   */
  static Props::Shared const &propsPlaceholder();
  static ShadowNode::SharedListOfShared const &childrenPlaceholder();
  static State::Shared const &statePlaceholder();

  /*
   * `ShadowNodeFragment` is not owning data-structure, it only stores raw
   * pointers to the data. `ShadowNodeFragment::Value` is a convenient owning
   * counterpart of that.
   */
  class Value final {
   public:
    /*
     * Creates an object with given `ShadowNodeFragment`.
     */
    Value(ShadowNodeFragment const &fragment);

    /*
     * Creates a `ShadowNodeFragment` from the object.
     */
    explicit operator ShadowNodeFragment() const;

   private:
    Props::Shared const props_;
    ShadowNode::SharedListOfShared const children_;
    State::Shared const state_;
  };
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
