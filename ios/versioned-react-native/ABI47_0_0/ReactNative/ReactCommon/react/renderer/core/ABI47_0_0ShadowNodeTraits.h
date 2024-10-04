/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * A set of predefined traits associated with a particular `ShadowNode` class
 * and an instance of that class. Used for efficient checking for interface
 * conformance for and storing important flags.
 */
class ShadowNodeTraits {
 public:
  /*
   * Underlying type for the traits.
   * The first 23 bits are reserved for Core.
   */
  enum Trait : int32_t {
    None = 0,

    // Note:
    // Not all traits are used yet (but all will be used in the near future).

    // Inherits `LayoutableShadowNode`.
    LayoutableKind = 1 << 0,

    // Inherits `YogaLayoutableShadowNode`.
    YogaLayoutableKind = 1 << 1,

    // Inherits `ConcreteViewShadowNode<>` template.
    ViewKind = 1 << 2,

    // Inherits `BaseTextShadowNode`.
    TextKind = 1 << 3,

    // Used when calculating relative layout in
    // LayoutableShadowNode::getRelativeLayoutMetrics. This trait marks node as
    // root, so when calculating relative layout, the calculation will not
    // traverse beyond this node. See T61257516 for details.
    RootNodeKind = 1 << 4,

    // `ViewShadowNode` (exact!) class.
    View = 1 << 5,

    // The node is hidden.
    // Nodes with this trait (and all their descendants) will not produce views.
    Hidden = 1 << 6,

    // Indicates that the `YogaLayoutableShadowNode` must set `isDirty` flag for
    // Yoga node when a `ShadowNode` is being cloned. `ShadowNode`s that modify
    // Yoga styles in the constructor (or later) *after* the `ShadowNode`
    // is cloned must set this trait.
    // Any Yoga node (not only Leaf ones) can have this trait.
    DirtyYogaNode = 1 << 9,

    // Inherits `YogaLayoutableShadowNode` and enforces that the `ABI47_0_0YGNode` is a
    // leaf.
    LeafYogaNode = 1 << 10,

    // Inherits `YogaLayoutableShadowNode` and has a custom measure function.
    // Only Leaf nodes can have this trait.
    MeasurableYogaNode = 1 << 11,

    // Indicates that the `ShadowNode` must form a stacking context.
    // A Stacking Context forms a level of a `ShadowView` hierarchy (in contrast
    // with a level of a `ShadowNode` hierarchy).
    // See W3C standard for more details: https://www.w3.org/TR/CSS2/zindex.html
    FormsStackingContext = 1 << 13,

    // Indicates that the node must form a `ShadowView`.
    FormsView = 1 << 14,

    // Internal to `ShadowNode`; do not use it outside.
    // Indicates that `children` list is shared between nodes and need
    // to be cloned before the first mutation.
    ChildrenAreShared = 1 << 15,

    // Inherits 'RawTextShadowNode'
    RawText = 1 << 16,

    // Inherits 'TextShadowNode'
    Text = 1 << 17,

    // Reserved
    ReservedTrait1 = 1 << 18,
    ReservedTrait2 = 1 << 19,
    ReservedTrait3 = 1 << 20,
    ReservedTrait4 = 1 << 21,
    ReservedTrait5 = 1 << 22,

    // Unserved - alias these for local usage
    UnreservedTrait1 = 1 << 23
  };

  /*
   * Sets, unsets, and checks individual traits.
   */
  inline void set(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ | trait);
  }

  inline void unset(Trait trait) {
    traits_ = ShadowNodeTraits::Trait(traits_ & ~trait);
  }

  inline bool check(Trait traits) const {
    return ShadowNodeTraits::Trait(traits_ & traits) == traits;
  }

 private:
  Trait traits_{Trait::None};
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
