/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0BaseTextShadowNode.h"

#include <ABI48_0_0React/ABI48_0_0renderer/components/text/RawTextProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/RawTextShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/TextProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/TextShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mounting/ShadowView.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

inline ShadowView shadowViewFromShadowNode(ShadowNode const &shadowNode) {
  auto shadowView = ShadowView{shadowNode};
  // Clearing `props` and `state` (which we don't use) allows avoiding retain
  // cycles.
  shadowView.props = nullptr;
  shadowView.state = nullptr;
  return shadowView;
}

void BaseTextShadowNode::buildAttributedString(
    TextAttributes const &baseTextAttributes,
    ShadowNode const &parentNode,
    AttributedString &outAttributedString,
    Attachments &outAttachments) {
  for (auto const &childNode : parentNode.getChildren()) {
    // RawShadowNode
    auto rawTextShadowNode =
        traitCast<RawTextShadowNode const *>(childNode.get());
    if (rawTextShadowNode != nullptr) {
      auto fragment = AttributedString::Fragment{};
      fragment.string = rawTextShadowNode->getConcreteProps().text;
      fragment.textAttributes = baseTextAttributes;

      // Storing a retaining pointer to `ParagraphShadowNode` inside
      // `attributedString` causes a retain cycle (besides that fact that we
      // don't need it at all). Storing a `ShadowView` instance instead of
      // `ShadowNode` should properly fix this problem.
      fragment.parentShadowView = shadowViewFromShadowNode(parentNode);
      outAttributedString.appendFragment(fragment);
      continue;
    }

    // TextShadowNode
    auto textShadowNode = traitCast<TextShadowNode const *>(childNode.get());
    if (textShadowNode != nullptr) {
      auto localTextAttributes = baseTextAttributes;
      localTextAttributes.apply(
          textShadowNode->getConcreteProps().textAttributes);
      buildAttributedString(
          localTextAttributes,
          *textShadowNode,
          outAttributedString,
          outAttachments);
      continue;
    }

    // Any *other* kind of ShadowNode
    auto fragment = AttributedString::Fragment{};
    fragment.string = AttributedString::Fragment::AttachmentCharacter();
    fragment.parentShadowView = shadowViewFromShadowNode(*childNode);
    fragment.textAttributes = baseTextAttributes;
    outAttributedString.appendFragment(fragment);
    outAttachments.push_back(Attachment{
        childNode.get(), outAttributedString.getFragments().size() - 1});
  }
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
