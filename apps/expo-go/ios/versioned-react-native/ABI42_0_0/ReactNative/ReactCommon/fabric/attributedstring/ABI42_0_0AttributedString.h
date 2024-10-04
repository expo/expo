/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <folly/Hash.h>
#include <folly/Optional.h>
#include <ABI42_0_0React/attributedstring/TextAttributes.h>
#include <ABI42_0_0React/core/Sealable.h>
#include <ABI42_0_0React/core/ShadowNode.h>
#include <ABI42_0_0React/debug/DebugStringConvertible.h>
#include <ABI42_0_0React/mounting/ShadowView.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * Simple, cross-platfrom, ABI42_0_0React-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString : public Sealable, public DebugStringConvertible {
 public:
  class Fragment {
   public:
    static std::string AttachmentCharacter();

    std::string string;
    TextAttributes textAttributes;
    ShadowView parentShadowView;

    /*
     * Returns true is the Fragment represents an attachment.
     * Equivalent to `string == AttachmentCharacter()`.
     */
    bool isAttachment() const;

    bool operator==(const Fragment &rhs) const;
    bool operator!=(const Fragment &rhs) const;
  };

  class Range {
   public:
    int location{0};
    int length{0};
  };

  using Fragments = better::small_vector<Fragment, 1>;

  /*
   * Appends and prepends a `fragment` to the string.
   */
  void appendFragment(const Fragment &fragment);
  void prependFragment(const Fragment &fragment);

  /*
   * Appends and prepends an `attributedString` (all its fragments) to
   * the string.
   */
  void appendAttributedString(const AttributedString &attributedString);
  void prependAttributedString(const AttributedString &attributedString);

  /*
   * Returns a read-only reference to a list of fragments.
   */
  Fragments const &getFragments() const;

  /*
   * Returns a reference to a list of fragments.
   */
  Fragments &getFragments();

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

  /*
   * Returns `true` if the string is empty (has no any fragments).
   */
  bool isEmpty() const;

  /**
   * Compares equality of TextAttributes of all Fragments on both sides.
   */
  bool compareTextAttributesWithoutFrame(const AttributedString &rhs) const;

  bool operator==(const AttributedString &rhs) const;
  bool operator!=(const AttributedString &rhs) const;

#pragma mark - DebugStringConvertible

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugChildren() const override;
#endif

 private:
  Fragments fragments_;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook

namespace std {
template <>
struct hash<ABI42_0_0facebook::ABI42_0_0React::AttributedString::Fragment> {
  size_t operator()(
      const ABI42_0_0facebook::ABI42_0_0React::AttributedString::Fragment &fragment) const {
    return folly::hash::hash_combine(
        0, fragment.string, fragment.textAttributes, fragment.parentShadowView);
  }
};

template <>
struct hash<ABI42_0_0facebook::ABI42_0_0React::AttributedString> {
  size_t operator()(
      const ABI42_0_0facebook::ABI42_0_0React::AttributedString &attributedString) const {
    auto seed = size_t{0};

    for (const auto &fragment : attributedString.getFragments()) {
      seed = folly::hash::hash_combine(seed, fragment);
    }

    return seed;
  }
};
} // namespace std
