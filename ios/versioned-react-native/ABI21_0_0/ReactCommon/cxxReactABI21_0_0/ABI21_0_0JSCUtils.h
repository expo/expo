// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI21_0_0/ABI21_0_0JSBigString.h>
#include <ABI21_0_0jschelpers/ABI21_0_0JavaScriptCore.h>
#include <ABI21_0_0jschelpers/ABI21_0_0Value.h>

namespace facebook {
namespace ReactABI21_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
