// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI20_0_0/ABI20_0_0JSBigString.h>
#include <ABI20_0_0jschelpers/ABI20_0_0JavaScriptCore.h>
#include <ABI20_0_0jschelpers/ABI20_0_0Value.h>

namespace facebook {
namespace ReactABI20_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
