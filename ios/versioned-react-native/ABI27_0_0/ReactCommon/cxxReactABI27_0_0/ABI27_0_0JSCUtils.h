// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI27_0_0/ABI27_0_0JSBigString.h>
#include <ABI27_0_0jschelpers/ABI27_0_0JavaScriptCore.h>
#include <ABI27_0_0jschelpers/ABI27_0_0Value.h>

namespace facebook {
namespace ReactABI27_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
