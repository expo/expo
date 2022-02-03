/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ReactMarker.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {
namespace ABI43_0_0ReactMarker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarker = nullptr;
LogTaggedMarkerWithInstanceKey logTaggedMarkerWithInstanceKey = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ABI43_0_0ReactMarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

} // namespace ABI43_0_0ReactMarker
} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
