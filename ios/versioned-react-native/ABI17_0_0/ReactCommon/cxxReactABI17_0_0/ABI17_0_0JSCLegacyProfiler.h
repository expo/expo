// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#ifdef WITH_JSC_EXTRA_TRACING

#include <ABI17_0_0jschelpers/ABI17_0_0JavaScriptCore.h>

namespace facebook {
namespace ReactABI17_0_0 {

void addNativeProfilingHooks(JSGlobalContextRef ctx);
void stopAndOutputProfilingFile(
    JSContextRef ctx,
    JSStringRef title,
    const char *filename);

} }

#endif
