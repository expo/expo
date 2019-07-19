/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <ReactABI34_0_0/components/text/ParagraphMeasurementCache.h>
#include <ReactABI34_0_0/components/text/ParagraphProps.h>
#include <ReactABI34_0_0/components/text/TextShadowNode.h>
#include <ReactABI34_0_0/components/view/ConcreteViewShadowNode.h>
#include <ReactABI34_0_0/core/ConcreteShadowNode.h>
#include <ReactABI34_0_0/core/LayoutContext.h>
#include <ReactABI34_0_0/core/ShadowNode.h>
#include <ReactABI34_0_0/textlayoutmanager/TextLayoutManager.h>

namespace facebook {
namespace ReactABI34_0_0 {

extern const char ParagraphComponentName[];

using ParagraphEventEmitter = ViewEventEmitter;

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode : public ConcreteViewShadowNode<
                                ParagraphComponentName,
                                ParagraphProps,
                                ParagraphEventEmitter>,
                            public BaseTextShadowNode {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString() const;

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphLocalData` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

  /*
   * Associates a shared LRU cache with the node.
   * `ParagraphShadowNode` uses this to cache the results of
   * text rendering measurements.
   * By design, the ParagraphComponentDescriptor outlives all
   * shadow nodes, so it's safe for this to be a raw pointer.
   */
  void setMeasureCache(const ParagraphMeasurementCache *cache);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measure(LayoutConstraints layoutConstraints) const override;

 private:
  /*
   * Creates a `LocalData` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateLocalDataIfNeeded();

  SharedTextLayoutManager textLayoutManager_;
  const ParagraphMeasurementCache *measureCache_;

  /*
   * Cached attributed string that represents the content of the subtree started
   * from the node.
   */
  mutable folly::Optional<AttributedString> cachedAttributedString_{};
};

} // namespace ReactABI34_0_0
} // namespace facebook
