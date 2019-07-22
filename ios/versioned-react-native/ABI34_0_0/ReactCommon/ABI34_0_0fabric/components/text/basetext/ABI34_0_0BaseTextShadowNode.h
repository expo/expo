/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/attributedstring/AttributedString.h>
#include <ReactABI34_0_0/attributedstring/TextAttributes.h>

namespace facebook {
namespace ReactABI34_0_0 {

/*
 * Base class (one of) for shadow nodes that represents attributed text,
 * such as Text and Paragraph (but not RawText).
 */
class BaseTextShadowNode {
 public:
  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString(
      const TextAttributes &baseTextAttributes,
      const SharedShadowNode &parentNode) const;
};

} // namespace ReactABI34_0_0
} // namespace facebook
