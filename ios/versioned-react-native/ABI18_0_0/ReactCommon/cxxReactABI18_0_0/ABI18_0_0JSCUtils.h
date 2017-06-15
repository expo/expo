// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI18_0_0/ABI18_0_0Executor.h>
#include <ABI18_0_0jschelpers/ABI18_0_0Value.h>

namespace facebook {
namespace ReactABI18_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
