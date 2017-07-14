// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI19_0_0/ABI19_0_0Executor.h>
#include <ABI19_0_0jschelpers/ABI19_0_0Value.h>

namespace facebook {
namespace ReactABI19_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
