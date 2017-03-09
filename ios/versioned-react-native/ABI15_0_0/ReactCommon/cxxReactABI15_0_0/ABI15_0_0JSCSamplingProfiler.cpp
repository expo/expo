// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI15_0_0JSCSamplingProfiler.h"

#include <stdio.h>
#include <string.h>
#include <ABI15_0_0jschelpers/ABI15_0_0JSCHelpers.h>
#include <ABI15_0_0jschelpers/ABI15_0_0Value.h>

#ifndef __APPLE__
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

namespace facebook {
namespace ReactABI15_0_0 {
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

  // Allow the profiler to be poked from JS as well
  // (see SamplingProfiler.js for an example of how it could be used with the JSCSamplingProfiler module).
  installGlobalFunction(ctx, "pokeSamplingProfiler", pokeSamplingProfiler);
}

}
}
