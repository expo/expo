// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI23_0_0/ABI23_0_0JSBigString.h>
#include <ABI23_0_0jschelpers/ABI23_0_0JavaScriptCore.h>
#include <ABI23_0_0jschelpers/ABI23_0_0Value.h>

namespace facebook {
namespace ReactABI23_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

/**
 * Parses "nativeRequire" parameters
 * and returns pair of "bundle id" & "module id" values
 */
std::pair<uint32_t, uint32_t> parseNativeRequireParameters(const JSGlobalContextRef& context,
                                                           const JSValueRef arguments[],
                                                           size_t argumentCount);

}
}
