/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0componentNameByABI48_0_0ReactViewName.h"

namespace ABI48_0_0facebook::ABI48_0_0React {

std::string componentNameByABI48_0_0ReactViewName(std::string viewName) {
  // We need this function only for the transition period;
  // eventually, all names will be unified.

  // TODO T97384889: unify component names between JS - Android - iOS - C++
  std::string rctPrefix("ABI48_0_0RCT");
  if (std::mismatch(rctPrefix.begin(), rctPrefix.end(), viewName.begin())
          .first == rctPrefix.end()) {
    // If `viewName` has "ABI48_0_0RCT" prefix, remove it.
    viewName.erase(0, rctPrefix.length());
  }

  // Fabric uses slightly new names for Text components because of differences
  // in semantic.
  if (viewName == "Text") {
    return "Paragraph";
  }

  // TODO T63839307: remove this condition after deleting TextInlineImage from
  // old renderer code
  if (viewName == "TextInlineImage") {
    return "Image";
  }
  if (viewName == "VirtualText") {
    return "Text";
  }

  if (viewName == "ImageView") {
    return "Image";
  }

  if (viewName == "AndroidHorizontalScrollView") {
    return "ScrollView";
  }

  if (viewName == "RKShimmeringView") {
    return "ShimmeringView";
  }

  if (viewName == "RefreshControl") {
    return "PullToRefreshView";
  }

  // We need this temporarily for testing purposes until we have proper
  // implementation of core components.
  // iOS-only
  if (viewName == "ScrollContentView") {
    return "View";
  }

  // iOS-only
  if (viewName == "MultilineTextInputView" ||
      viewName == "SinglelineTextInputView") {
    return "TextInput";
  }

  return viewName;
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
