/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/AttributedString.h>
#include <ABI31_0_0fabric/ABI31_0_0attributedstring/TextAttributes.h>

namespace facebook {
namespace ReactABI31_0_0 {

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
    const SharedShadowNodeList &childNodes
  ) const;
};

} // namespace ReactABI31_0_0
} // namespace facebook
