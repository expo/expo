/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/TextAttributes.h>
#include <ABI31_0_0fabric/ABI31_0_0core/Sealable.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ShadowNode.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>
#include <folly/Optional.h>

namespace facebook {
namespace ReactABI31_0_0 {

class AttributedString;

using SharedAttributedString = std::shared_ptr<const AttributedString>;

/*
 * Simple, cross-platfrom, ReactABI31_0_0-specific implementation of attributed string
 * (aka spanned string).
 * `AttributedString` is basically a list of `Fragments` which have `string` and
 * `textAttributes` + `shadowNode` associated with the `string`.
 */
class AttributedString:
  public Sealable,
  public DebugStringConvertible {

public:

  class Fragment {
  public:
    std::string string;
    TextAttributes textAttributes;
    SharedShadowNode shadowNode;
  };

  using Fragments = std::vector<Fragment>;

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
   * Returns read-only reference to a list of fragments.
   */
  const Fragments &getFragments() const;

  /*
   * Returns a string constructed from all strings in all fragments.
   */
  std::string getString() const;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugChildren() const override;

private:

  Fragments fragments_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
