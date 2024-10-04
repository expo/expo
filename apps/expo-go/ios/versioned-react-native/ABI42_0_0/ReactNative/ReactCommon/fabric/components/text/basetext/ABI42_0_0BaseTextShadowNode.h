/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/attributedstring/AttributedString.h>
#include <ABI42_0_0React/attributedstring/TextAttributes.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Base class (one of) for shadow nodes that represents attributed text,
 * such as Text and Paragraph (but not RawText).
 */
class BaseTextShadowNode {
 public:
  /*
   * Represents additional information associated with some fragments which
   * represent embedded into text component (such as an image or inline view).
   */
  class Attachment final {
   public:
    /*
     * Unowning pointer to a `ShadowNode` that represents the attachment.
     * Cannot be `null`.
     */
    ShadowNode const *shadowNode;

    /*
     * Index of the fragment in `AttributedString` that represents the
     * the attachment.
     */
    size_t fragmentIndex;
  };

  /*
   * A list of `Attachment`s.
   * Performance-wise, the prevailing case is when there are no attachments
   * at all, therefore we don't need an inline buffer (`small_vector`).
   */
  using Attachments = std::vector<Attachment>;

  /*
   * Builds an `AttributedString` which represents text content of the node.
   * This is static so that both Paragraph (which subclasses BaseText) and
   * TextInput (which does not) can use this.
   * TODO T53299884: decide if this should be moved out and made a static
   * function, or if TextInput should inherit from BaseTextShadowNode.
   */
  static void buildAttributedString(
      TextAttributes const &baseTextAttributes,
      ShadowNode const &parentNode,
      AttributedString &outAttributedString,
      Attachments &outAttachments);
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
