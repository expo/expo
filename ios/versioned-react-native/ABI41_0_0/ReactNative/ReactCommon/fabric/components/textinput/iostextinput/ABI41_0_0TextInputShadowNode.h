/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/attributedstring/AttributedString.h>
#include <ABI41_0_0React/components/iostextinput/TextInputEventEmitter.h>
#include <ABI41_0_0React/components/iostextinput/TextInputProps.h>
#include <ABI41_0_0React/components/iostextinput/TextInputState.h>
#include <ABI41_0_0React/components/text/BaseTextShadowNode.h>
#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI41_0_0React/textlayoutmanager/TextLayoutManager.h>
#include <ABI41_0_0React/utils/ContextContainer.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char TextInputComponentName[];

/*
 * `ShadowNode` for <TextInput> component.
 */
class TextInputShadowNode : public ConcreteViewShadowNode<
                                TextInputComponentName,
                                TextInputProps,
                                TextInputEventEmitter,
                                TextInputState>,
                            public BaseTextShadowNode {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::TextKind);
    return traits;
  }

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;

  /*
   * Associates a shared `TextLayoutManager` with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(TextLayoutManager::Shared const &textLayoutManager);

#pragma mark - LayoutableShadowNode

  Size measure(LayoutConstraints layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  /*
   * Creates a `State` object if needed.
   */
  void updateStateIfNeeded();

  /*
   * Returns an `AttributedStringBox` which represents text content that should
   * be used for measuring purposes. It might contain actual text value,
   * placeholder value or some character that represents the size of the font.
   */
  AttributedStringBox attributedStringBoxToMeasure() const;

  TextLayoutManager::Shared textLayoutManager_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
