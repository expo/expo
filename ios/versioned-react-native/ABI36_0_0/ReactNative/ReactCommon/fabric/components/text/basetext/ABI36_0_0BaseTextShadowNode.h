/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI36_0_0React/attributedstring/AttributedString.h>
#include <ABI36_0_0React/attributedstring/TextAttributes.h>

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

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

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
