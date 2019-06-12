//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#pragma once

#include <ABI33_0_0jsi/ABI33_0_0jsi.h>
#include <memory.h>

namespace facebook {
namespace ABI33_0_0jsc {

std::unique_ptr<ABI33_0_0jsi::Runtime> makeABI33_0_0JSCRuntime();

} // namespace ABI33_0_0jsc
} // namespace facebook
