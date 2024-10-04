/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/AttributedString.h>
#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * State for <TextInput> component.
 */
class AndroidTextInputState final {
 public:
  int64_t mostRecentEventCount{0};

  /**
   * Stores an opaque cache ID used on the Java side to refer to a specific
   * AttributedString for measurement purposes only.
   */
  int64_t cachedAttributedStringId{0};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * Only set if changed from the ABI43_0_0React tree's perspective.
   */
  AttributedString attributedString{};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * This stores the previous computed *from the ABI43_0_0React tree*. This usually
   * doesn't change as the TextInput contents are being updated. If it does
   * change, we need to wipe out current contents of the TextInput and replace
   * with the new value from the tree.
   */
  AttributedString ABI43_0_0ReactTreeAttributedString{};

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes{};

  /**
   * Default TextAttributes used if we need to construct a new Fragment.
   * Only used if text is inserted into an AttributedString with no existing
   * Fragments.
   */
  TextAttributes defaultTextAttributes;

  /**
   * Default parent ShadowView used if we need to construct a new Fragment.
   * Only used if text is inserted into an AttributedString with no existing
   * Fragments.
   */
  ShadowView defaultParentShadowView;

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager layoutManager{};

  /**
   * Communicates Android theme padding back to the ShadowNode / Component
   * Descriptor for layout.
   */
  float defaultThemePaddingStart{NAN};
  float defaultThemePaddingEnd{NAN};
  float defaultThemePaddingTop{NAN};
  float defaultThemePaddingBottom{NAN};

  AndroidTextInputState(
      int64_t mostRecentEventCount,
      AttributedString const &attributedString,
      AttributedString const &ABI43_0_0ReactTreeAttributedString,
      ParagraphAttributes const &paragraphAttributes,
      TextAttributes const &defaultTextAttributes,
      ShadowView const &defaultParentShadowView,
      SharedTextLayoutManager const &layoutManager,
      float defaultThemePaddingStart,
      float defaultThemePaddingEnd,
      float defaultThemePaddingTop,
      float defaultThemePaddingBottom);

  AndroidTextInputState() = default;
  AndroidTextInputState(
      AndroidTextInputState const &previousState,
      folly::dynamic const &data);
  folly::dynamic getDynamic() const;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
