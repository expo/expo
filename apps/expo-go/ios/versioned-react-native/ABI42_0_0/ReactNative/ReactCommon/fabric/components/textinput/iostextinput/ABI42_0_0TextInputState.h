/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI42_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI42_0_0React/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * State for <TextInput> component.
 */
class TextInputState final {
 public:
  /*
   * All content of <TextInput> component.
   */
  AttributedStringBox attributedStringBox;

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * This stores the previous computed *from the ABI42_0_0React tree*. This usually
   * doesn't change as the TextInput contents are being updated. If it does
   * change, we need to wipe out current contents of the TextInput and replace
   * with the new value from the tree.
   */
  AttributedString ABI42_0_0ReactTreeAttributedString{};

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager layoutManager;

  size_t mostRecentEventCount{0};
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
