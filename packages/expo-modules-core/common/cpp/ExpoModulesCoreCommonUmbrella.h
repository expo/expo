// Copyright 2025-present 650 Industries. All rights reserved.
//
// Umbrella for C++ headers in common/cpp/. ObjC++ consumers can `#import
// "ExpoModulesCoreCommon.h"` to pull in the JSI / Fabric / shared-object
// types without per-header includes. The quoted form works under both
// CocoaPods (which adds common/cpp to the pod's header search path) and
// SwiftPM (where the ExpoModulesCoreCommon target's `publicHeadersPath`
// puts common/cpp on the include path).

#pragma once

#ifdef __cplusplus

#include "EventEmitter.h"
#include "LazyObject.h"
#include "NativeModule.h"
#include "SharedObject.h"
#include "SharedRef.h"
#include "JSI/BridgelessJSCallInvoker.h"
#include "fabric/ExpoViewComponentDescriptor.h"
#include "fabric/ExpoViewProps.h"

#endif // __cplusplus
