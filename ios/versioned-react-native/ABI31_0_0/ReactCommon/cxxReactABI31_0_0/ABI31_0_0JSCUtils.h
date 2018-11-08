// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cxxReactABI31_0_0/ABI31_0_0JSBigString.h>
#include <ABI31_0_0jschelpers/ABI31_0_0JavaScriptCore.h>
#include <ABI31_0_0jschelpers/ABI31_0_0Value.h>

namespace facebook {
namespace ReactABI31_0_0 {

String jsStringFromBigString(JSContextRef ctx, const JSBigString& bigstr);

}
}
