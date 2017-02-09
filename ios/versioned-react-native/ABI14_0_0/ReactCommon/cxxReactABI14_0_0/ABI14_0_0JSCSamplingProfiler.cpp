// Copyright 2004-present Facebook. All Rights Reserved.

#ifdef WITH_JSC_EXTRA_TRACING

#include "ABI14_0_0JSCSamplingProfiler.h"

#include <stdio.h>
#include <string.h>
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#include <ABI14_0_0jschelpers/ABI14_0_0JSCHelpers.h>
#include <ABI14_0_0jschelpers/ABI14_0_0Value.h>

namespace facebook {
namespace ReactABI14_0_0 {
namespace {
static JSValueRef pokeSamplingProfiler(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return JSC_JSPokeSamplingProfiler(ctx);
}
}

void initSamplingProfilerOnMainJSCThread(JSGlobalContextRef ctx) {
  JSC_JSStartSamplingProfilingOnMainJSCThread(ctx);
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

}
}

#endif // WITH_JSC_EXTRA_TRACING
