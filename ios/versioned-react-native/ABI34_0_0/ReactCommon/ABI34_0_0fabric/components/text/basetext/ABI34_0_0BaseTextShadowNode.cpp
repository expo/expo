/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0BaseTextShadowNode.h"

#include <ReactABI34_0_0/components/text/RawTextProps.h>
#include <ReactABI34_0_0/components/text/RawTextShadowNode.h>
#include <ReactABI34_0_0/components/text/TextProps.h>
#include <ReactABI34_0_0/components/text/TextShadowNode.h>
#include <ReactABI34_0_0/debug/DebugStringConvertibleItem.h>
#include <ReactABI34_0_0/mounting/ShadowView.h>

namespace facebook {
namespace ReactABI34_0_0 {

AttributedString BaseTextShadowNode::getAttributedString(
    const TextAttributes &textAttributes,
    const SharedShadowNode &parentNode) const {
  auto attributedString = AttributedString{};

  for (const auto &childNode : parentNode->getChildren()) {
    // RawShadowNode
    auto rawTextShadowNode =
        std::dynamic_pointer_cast<const RawTextShadowNode>(childNode);
    if (rawTextShadowNode) {
      auto fragment = AttributedString::Fragment{};
      fragment.string = rawTextShadowNode->getProps()->text;
      fragment.textAttributes = textAttributes;

      // Storing a retaining pointer to `ParagraphShadowNode` inside
      // `attributedString` causes a retain cycle (besides that fact that we
      // don't need it at all). Storing a `ShadowView` instance instead of
      // `ShadowNode` should properly fix this problem.
      fragment.parentShadowView = ShadowView(*parentNode);
      attributedString.appendFragment(fragment);
      continue;
    }

    // TextShadowNode
    auto textShadowNode =
        std::dynamic_pointer_cast<const TextShadowNode>(childNode);
    if (textShadowNode) {
      auto localTextAttributes = textAttributes;
      localTextAttributes.apply(textShadowNode->getProps()->textAttributes);
      attributedString.appendAttributedString(
          textShadowNode->getAttributedString(
              localTextAttributes, textShadowNode));
      continue;
    }

    // Any other kind of ShadowNode
    auto fragment = AttributedString::Fragment{};
    fragment.shadowView = ShadowView(*childNode);
    fragment.textAttributes = textAttributes;
    attributedString.appendFragment(fragment);
  }

  return attributedString;
}

} // namespace ReactABI34_0_0
} // namespace facebook
