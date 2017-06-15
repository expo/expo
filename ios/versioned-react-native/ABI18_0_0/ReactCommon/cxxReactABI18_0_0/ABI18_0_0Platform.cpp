// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI18_0_0Platform.h"

namespace facebook {
namespace ReactABI18_0_0 {

namespace ReactABI18_0_0Marker {
LogMarker logMarker;
};

namespace PerfLogging {
InstallNativeHooks installNativeHooks;
};

namespace JSNativeHooks {
Hook loggingHook = nullptr;
Hook nowHook = nullptr;
}

} }
