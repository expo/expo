/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI49_0_0AndroidTextInputEventEmitter.h"
#include "ABI49_0_0AndroidTextInputProps.h"
#include "ABI49_0_0AndroidTextInputState.h"

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode final : public ConcreteViewShadowNode<
                                             AndroidTextInputComponentName,
                                             AndroidTextInputProps,
                                             AndroidTextInputEventEmitter,
                                             AndroidTextInputState> {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::TextKind);
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  void setContextContainer(ContextContainer *contextContainer);

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;
  AttributedString getPlaceholderAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  ContextContainer *contextContainer_{};

  /**
   * Get the most up-to-date attributed string for measurement and State.
   */
  AttributedString getMostRecentAttributedString() const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded();

  SharedTextLayoutManager textLayoutManager_;

  /*
   * Cached attributed string that represents the content of the subtree started
   * from the node.
   */
  mutable std::optional<AttributedString> cachedAttributedString_{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
