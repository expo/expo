// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ABI31_0_0ReactMarker.h"

namespace facebook {
namespace ReactABI31_0_0 {
namespace ReactABI31_0_0Marker {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

LogTaggedMarker logTaggedMarker = nullptr;

#if __clang__
#pragma clang diagnostic pop
#endif

void logMarker(const ReactABI31_0_0MarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}

}
}
}
