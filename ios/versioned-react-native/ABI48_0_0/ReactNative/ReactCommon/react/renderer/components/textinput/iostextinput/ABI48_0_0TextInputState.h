/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/AttributedStringBox.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * State for <TextInput> component.
 */
class TextInputState final {
 public:
  TextInputState() = default;

  /*
   * All content of <TextInput> component.
   */
  AttributedStringBox attributedStringBox;

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * This stores the previous computed *from the ABI48_0_0React tree*. This usually
   * doesn't change as the TextInput contents are being updated. If it does
   * change, we need to wipe out current contents of the TextInput and replace
   * with the new value from the tree.
   */
  AttributedString ABI48_0_0ReactTreeAttributedString{};

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
  std::shared_ptr<TextLayoutManager const> layoutManager;

  size_t mostRecentEventCount{0};

#ifdef ANDROID
  TextInputState(
      TextInputState const &previousState,
      folly::dynamic const &data);

  folly::dynamic getDynamic() const;

  MapBuffer getMapBuffer() const;
#endif
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
