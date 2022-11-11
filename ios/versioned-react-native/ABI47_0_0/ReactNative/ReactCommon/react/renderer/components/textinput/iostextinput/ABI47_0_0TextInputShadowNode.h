/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/AttributedString.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/iostextinput/TextInputEventEmitter.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/iostextinput/TextInputProps.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/iostextinput/TextInputState.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/text/BaseTextShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/textlayoutmanager/TextLayoutManager.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

extern const char TextInputComponentName[];

/*
 * `ShadowNode` for <TextInput> component.
 */
class TextInputShadowNode final : public ConcreteViewShadowNode<
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
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }

  /*
   * Associates a shared `TextLayoutManager` with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<TextLayoutManager const> textLayoutManager);

#pragma mark - LayoutableShadowNode

  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;
  void layout(LayoutContext layoutContext) override;

 private:
  /*
   * Creates a `State` object if needed.
   */
  void updateStateIfNeeded(LayoutContext const &layoutContext);

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString(
      LayoutContext const &layoutContext) const;

  /*
   * Returns an `AttributedStringBox` which represents text content that should
   * be used for measuring purposes. It might contain actual text value,
   * placeholder value or some character that represents the size of the font.
   */
  AttributedStringBox attributedStringBoxToMeasure(
      LayoutContext const &layoutContext) const;

  std::shared_ptr<TextLayoutManager const> textLayoutManager_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
