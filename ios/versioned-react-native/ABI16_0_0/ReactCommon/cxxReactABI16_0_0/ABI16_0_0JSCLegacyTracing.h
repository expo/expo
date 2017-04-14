// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#if defined(WITH_JSC_EXTRA_TRACING)

#include <ABI16_0_0jschelpers/ABI16_0_0JavaScriptCore.h>

namespace facebook {
namespace ReactABI16_0_0 {

void addNativeTracingLegacyHooks(JSGlobalContextRef ctx);

} }

#endif
