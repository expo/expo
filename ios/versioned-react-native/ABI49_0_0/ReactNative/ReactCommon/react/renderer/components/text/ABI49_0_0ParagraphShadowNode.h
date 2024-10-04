/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/text/BaseTextShadowNode.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphEventEmitter.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphLayoutManager.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphProps.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphState.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

extern char const ParagraphComponentName[];

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode final : public ConcreteViewShadowNode<
                                      ParagraphComponentName,
                                      ParagraphProps,
                                      ParagraphEventEmitter,
                                      ParagraphState>,
                                  public BaseTextShadowNode {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::TextKind);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);

#ifdef ANDROID
    // Unsetting `FormsStackingContext` trait is essential on Android where we
    // can't mount views inside `TextView`.
    traits.unset(ShadowNodeTraits::Trait::FormsStackingContext);
#endif

    return traits;
  }

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<TextLayoutManager const> textLayoutManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measureContent(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const override;

  /*
   * Internal representation of the nested content of the node in a format
   * suitable for future processing.
   */
  class Content final {
   public:
    AttributedString attributedString;
    ParagraphAttributes paragraphAttributes;
    Attachments attachments;
  };

 private:
  /*
   * Builds (if needed) and returns a reference to a `Content` object.
   */
  Content const &getContent(LayoutContext const &layoutContext) const;

  /*
   * Builds and returns a `Content` object with given `layoutConstraints`.
   */
  Content getContentWithMeasuredAttachments(
      LayoutContext const &layoutContext,
      LayoutConstraints const &layoutConstraints) const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded(Content const &content);

  /*
   * Cached content of the subtree started from the node.
   */
  mutable std::optional<Content> content_{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
