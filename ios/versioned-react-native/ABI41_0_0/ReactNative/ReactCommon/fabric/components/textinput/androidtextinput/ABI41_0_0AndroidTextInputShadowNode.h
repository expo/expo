/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI41_0_0AndroidTextInputEventEmitter.h"
#include "ABI41_0_0AndroidTextInputProps.h"
#include "ABI41_0_0AndroidTextInputState.h"

#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI41_0_0React/utils/ContextContainer.h>

#include <ABI41_0_0React/attributedstring/AttributedString.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode : public ConcreteViewShadowNode<
                                       AndroidTextInputComponentName,
                                       AndroidTextInputProps,
                                       AndroidTextInputEventEmitter,
                                       AndroidTextInputState> {
 public:
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

  Size measure(LayoutConstraints layoutConstraints) const override;
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
  mutable folly::Optional<AttributedString> cachedAttributedString_{};
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
