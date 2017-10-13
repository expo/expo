// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI22_0_0/ABI22_0_0JSBigString.h>
#include <ABI22_0_0jschelpers/ABI22_0_0JavaScriptCore.h>
#include <ABI22_0_0jschelpers/ABI22_0_0Value.h>

namespace facebook {
namespace ReactABI22_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
