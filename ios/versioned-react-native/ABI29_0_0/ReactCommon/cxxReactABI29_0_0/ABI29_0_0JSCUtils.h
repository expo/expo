// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI29_0_0/ABI29_0_0JSBigString.h>
#include <ABI29_0_0jschelpers/ABI29_0_0JavaScriptCore.h>
#include <ABI29_0_0jschelpers/ABI29_0_0Value.h>

namespace facebook {
namespace ReactABI29_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
