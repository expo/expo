/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/AttributedString.h>
#include <ABI31_0_0fabric/ABI31_0_0attributedstring/ParagraphAttributes.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutConstraints.h>

namespace facebook {
namespace ReactABI31_0_0 {

class TextLayoutManager;

using SharedTextLayoutManager = std::shared_ptr<const TextLayoutManager>;

/*
 * Cross platform facade for Android-specific TextLayoutManager.
 */
class TextLayoutManager {

public:

  TextLayoutManager();
  ~TextLayoutManager();

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  Size measure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints
  ) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

private:
  
  void *self_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
