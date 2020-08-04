/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI37_0_0React/core/EventEmitter.h>
#include <ABI37_0_0React/core/ABI37_0_0ReactPrimitives.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class ComponentDescriptor;

/*
 * Represents all things that shadow nodes from the same family have in common.
 * To be used inside `ShadowNode` class *only*.
 */
class ShadowNodeFamily {
 public:
  using Shared = std::shared_ptr<ShadowNodeFamily const>;
  using Weak = std::weak_ptr<ShadowNodeFamily const>;

  ShadowNodeFamily(
      Tag tag,
      SurfaceId surfaceId,
      SharedEventEmitter const &eventEmitter,
      ComponentDescriptor const &componentDescriptor);

  /*
   * Sets the parent.
   * This is not technically thread-safe, but practically it mutates the object
   * only once (and the model enforces that this first call is not concurrent).
   */
  void setParent(ShadowNodeFamily::Shared const &parent) const;

 private:
  friend ShadowNode;

  /*
   * Deprecated.
   */
  Tag const tag_;

  /*
   * Identifier of a running Surface instance.
   */
  SurfaceId const surfaceId_;

  /*
   * `EventEmitter` associated with all nodes of the family.
   */
  SharedEventEmitter const eventEmitter_;

  /*
   * Reference to a concrete `ComponentDescriptor` that manages nodes of this
   * type.
   */
  ComponentDescriptor const &componentDescriptor_;

  /*
   * Points to a family of all parent nodes of all nodes of the family.
   */
  mutable ShadowNodeFamily::Weak parent_{};

  /*
   * Represents a case where `parent_` is `nullptr`.
   * For optimization purposes only.
   */
  mutable bool hasParent_{false};
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
