// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ReactABI35_0_0Marker.h"

namespace ABI35_0_0facebook {
namespace ReactABI35_0_0 {
namespace ReactABI35_0_0Marker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarker = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ReactABI35_0_0MarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

}
}
}
