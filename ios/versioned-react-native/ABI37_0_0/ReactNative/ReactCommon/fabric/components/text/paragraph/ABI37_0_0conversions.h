// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <folly/dynamic.h>
#include <ABI37_0_0React/attributedstring/conversions.h>
#include <ABI37_0_0React/components/text/ParagraphState.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

#ifdef ANDROID
inline folly::dynamic toDynamic(ParagraphState const &paragraphState) {
  folly::dynamic newState = folly::dynamic::object();
  newState["attributedString"] = toDynamic(paragraphState.attributedString);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
