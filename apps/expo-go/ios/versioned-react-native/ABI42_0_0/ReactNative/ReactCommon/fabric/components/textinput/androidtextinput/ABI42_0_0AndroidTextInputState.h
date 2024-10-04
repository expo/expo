/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/attributedstring/AttributedString.h>
#include <ABI42_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI42_0_0React/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * State for <Paragraph> component.
 * Represents what to render and how to render.
 */
class AndroidTextInputState final {
 public:
  int64_t mostRecentEventCount{0};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   */
  AttributedString attributedString{};

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

#ifdef ANDROID
  AttributedString updateAttributedString(
      TextAttributes const &defaultTextAttributes,
      ShadowView const &defaultParentShadowView,
      AttributedString const &original,
      folly::dynamic const &data) {
    if (data["textChanged"].empty()) {
      return original;
    }

    // TODO: parse other attributes besides just string?
    // on the other hand, not much should be driven from Java
    // TODO: it'd be really nice to treat these as operational transforms
    // instead of having to pass the whole string across.
    // Unfortunately we don't have a good way of communicating from Java to C++
    // *which* version of the State changes should be applied to; and if there's
    // a conflict, we don't have any recourse of any way to bail out of a
    // commit.

    auto str = AttributedString{};

    int i = 0;
    folly::dynamic fragments = data["textChanged"]["fragments"];
    for (auto const &fragment : original.getFragments()) {
      str.appendFragment(AttributedString::Fragment{
          fragments.size() > i ? fragments[i]["string"].getString() : "",
          fragment.textAttributes,
          fragment.parentShadowView});
      i++;
    }

    if (fragments.size() > original.getFragments().size()) {
      for (; i < fragments.size(); i++) {
        str.appendFragment(
            AttributedString::Fragment{fragments[i]["string"].getString(),
                                       defaultTextAttributes,
                                       defaultParentShadowView});
      }
    }

    return str;
  }

  AndroidTextInputState(
      int64_t mostRecentEventCount,
      AttributedString const &attributedString,
      AttributedString const &ABI42_0_0ReactTreeAttributedString,
      ParagraphAttributes const &paragraphAttributes,
      TextAttributes const &defaultTextAttributes,
      ShadowView const &defaultParentShadowView,
      SharedTextLayoutManager const &layoutManager,
      float defaultThemePaddingStart,
      float defaultThemePaddingEnd,
      float defaultThemePaddingTop,
      float defaultThemePaddingBottom)
      : mostRecentEventCount(mostRecentEventCount),
        attributedString(attributedString),
        ABI42_0_0ReactTreeAttributedString(ABI42_0_0ReactTreeAttributedString),
        paragraphAttributes(paragraphAttributes),
        defaultTextAttributes(defaultTextAttributes),
        defaultParentShadowView(defaultParentShadowView),
        layoutManager(layoutManager),
        defaultThemePaddingStart(defaultThemePaddingStart),
        defaultThemePaddingEnd(defaultThemePaddingEnd),
        defaultThemePaddingTop(defaultThemePaddingTop),
        defaultThemePaddingBottom(defaultThemePaddingBottom) {}
  AndroidTextInputState() = default;
  AndroidTextInputState(
      AndroidTextInputState const &previousState,
      folly::dynamic const &data)
      : mostRecentEventCount(data.getDefault(
                                     "mostRecentEventCount",
                                     previousState.mostRecentEventCount)
                                 .getInt()),
        attributedString(updateAttributedString(
            previousState.defaultTextAttributes,
            previousState.defaultParentShadowView,
            previousState.attributedString,
            data)),
        ABI42_0_0ReactTreeAttributedString(previousState.ABI42_0_0ReactTreeAttributedString),
        paragraphAttributes(previousState.paragraphAttributes),
        defaultTextAttributes(previousState.defaultTextAttributes),
        defaultParentShadowView(previousState.defaultParentShadowView),
        layoutManager(previousState.layoutManager),
        defaultThemePaddingStart(data.getDefault(
                                         "themePaddingStart",
                                         previousState.defaultThemePaddingStart)
                                     .getDouble()),
        defaultThemePaddingEnd(data.getDefault(
                                       "themePaddingEnd",
                                       previousState.defaultThemePaddingEnd)
                                   .getDouble()),
        defaultThemePaddingTop(data.getDefault(
                                       "themePaddingTop",
                                       previousState.defaultThemePaddingTop)
                                   .getDouble()),
        defaultThemePaddingBottom(
            data.getDefault(
                    "themePaddingBottom",
                    previousState.defaultThemePaddingBottom)
                .getDouble()){};
  folly::dynamic getDynamic() const;
#endif
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
