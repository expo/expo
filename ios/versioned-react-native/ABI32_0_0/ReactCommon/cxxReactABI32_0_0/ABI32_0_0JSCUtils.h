// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cxxReactABI32_0_0/ABI32_0_0JSBigString.h>
#include <ABI32_0_0jschelpers/ABI32_0_0JavaScriptCore.h>
#include <ABI32_0_0jschelpers/ABI32_0_0Value.h>

namespace facebook {
namespace ReactABI32_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
