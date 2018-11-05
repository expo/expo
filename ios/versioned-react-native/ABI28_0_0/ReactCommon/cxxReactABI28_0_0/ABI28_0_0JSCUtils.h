// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI28_0_0/ABI28_0_0JSBigString.h>
#include <ABI28_0_0jschelpers/ABI28_0_0JavaScriptCore.h>
#include <ABI28_0_0jschelpers/ABI28_0_0Value.h>

namespace facebook {
namespace ReactABI28_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
