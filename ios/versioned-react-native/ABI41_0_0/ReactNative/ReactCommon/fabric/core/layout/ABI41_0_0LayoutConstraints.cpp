/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0LayoutConstraints.h"

#include <algorithm>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

Size LayoutConstraints::clamp(const Size &size) const {
  return {
      std::max(minimumSize.width, std::min(maximumSize.width, size.width)),
      std::max(minimumSize.height, std::min(maximumSize.height, size.height))};
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
