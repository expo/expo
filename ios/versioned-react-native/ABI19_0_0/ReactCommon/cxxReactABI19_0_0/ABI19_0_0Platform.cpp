// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI19_0_0Platform.h"

namespace facebook {
namespace ReactABI19_0_0 {

#if __clang__
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wglobal-constructors"
#endif

namespace ReactABI19_0_0Marker {
LogTaggedMarker logTaggedMarker = nullptr;

void logMarker(const ReactABI19_0_0MarkerId markerId) {
  logTaggedMarker(markerId, nullptr);
}
};

namespace PerfLogging {
InstallNativeHooks installNativeHooks = nullptr;
};

namespace JSNativeHooks {
Hook loggingHook = nullptr;
Hook nowHook = nullptr;
}

#if __clang__
#pragma clang diagnostic pop
#endif

} }
