/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <ABI37_0_0React/components/text/ParagraphMeasurementCache.h>
#include <ABI37_0_0React/components/text/ParagraphProps.h>
#include <ABI37_0_0React/components/text/ParagraphState.h>
#include <ABI37_0_0React/components/text/TextShadowNode.h>
#include <ABI37_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI37_0_0React/core/ConcreteShadowNode.h>
#include <ABI37_0_0React/core/LayoutContext.h>
#include <ABI37_0_0React/core/ShadowNode.h>
#include <ABI37_0_0React/textlayoutmanager/TextLayoutManager.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

extern char const ParagraphComponentName[];

using ParagraphEventEmitter = ViewEventEmitter;

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode : public ConcreteViewShadowNode<
                                ParagraphComponentName,
                                ParagraphProps,
                                ParagraphEventEmitter,
                                ParagraphState>,
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
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

  /*
   * Associates a shared LRU cache with the node.
   * `ParagraphShadowNode` uses this to cache the results of
   * text rendering measurements.
   * By design, the ParagraphComponentDescriptor outlives all
   * shadow nodes, so it's safe for this to be a raw pointer.
   */
  void setMeasureCache(ParagraphMeasurementCache const *cache);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;
  Size measure(LayoutConstraints layoutConstraints) const override;

 private:
  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded();

  SharedTextLayoutManager textLayoutManager_;
  ParagraphMeasurementCache const *measureCache_;

  /*
   * Cached attributed string that represents the content of the subtree started
   * from the node.
   */
  mutable folly::Optional<AttributedString> cachedAttributedString_{};
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
