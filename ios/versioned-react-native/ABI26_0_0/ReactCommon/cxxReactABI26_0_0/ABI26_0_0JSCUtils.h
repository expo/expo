// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI26_0_0/ABI26_0_0JSBigString.h>
#include <ABI26_0_0jschelpers/ABI26_0_0JavaScriptCore.h>
#include <ABI26_0_0jschelpers/ABI26_0_0Value.h>

namespace facebook {
namespace ReactABI26_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
