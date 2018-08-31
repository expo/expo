// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI30_0_0/ABI30_0_0JSBigString.h>
#include <ABI30_0_0jschelpers/ABI30_0_0JavaScriptCore.h>
#include <ABI30_0_0jschelpers/ABI30_0_0Value.h>

namespace facebook {
namespace ReactABI30_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
