// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI21_0_0JSCSamplingProfiler.h"

#include <ABI21_0_0jschelpers/ABI21_0_0JSCHelpers.h>

static JSValueRef pokeSamplingProfiler(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return JSC_JSPokeSamplingProfiler(ctx);
}

namespace facebook {
namespace ReactABI21_0_0 {

void initSamplingProfilerOnMainJSCThread(JSGlobalContextRef ctx) {
  JSC_JSStartSamplingProfilingOnMainJSCThread(ctx);

  // Allow the profiler to be poked from JS as well
  // (see SamplingProfiler.js for an example of how it could be used with the JSCSamplingProfiler module).
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

} }
