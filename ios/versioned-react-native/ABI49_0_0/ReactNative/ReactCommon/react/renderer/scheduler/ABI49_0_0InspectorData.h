/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <vector>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

struct InspectorData {
  std::vector<std::string> hierarchy;
  int selectedIndex;
  std::string fileName;
  int lineNumber;
  int columnNumber;
  // TODO T97216348: remove folly::dynamic from InspectorData struct
  folly::dynamic props;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
