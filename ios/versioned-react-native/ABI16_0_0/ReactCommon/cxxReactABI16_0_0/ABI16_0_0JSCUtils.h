// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI16_0_0/ABI16_0_0Executor.h>
#include <ABI16_0_0jschelpers/ABI16_0_0Value.h>

namespace facebook {
namespace ReactABI16_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
