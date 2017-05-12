// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI17_0_0/ABI17_0_0Executor.h>
#include <ABI17_0_0jschelpers/ABI17_0_0Value.h>

namespace facebook {
namespace ReactABI17_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
