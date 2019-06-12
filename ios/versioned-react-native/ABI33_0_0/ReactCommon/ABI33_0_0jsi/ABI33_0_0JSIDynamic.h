//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#pragma once

#include <folly/dynamic.h>
#include <ABI33_0_0jsi/ABI33_0_0jsi.h>

namespace facebook {
namespace ABI33_0_0jsi {

facebook::ABI33_0_0jsi::Value valueFromDynamic(
  facebook::ABI33_0_0jsi::Runtime& runtime, const folly::dynamic& dyn);

folly::dynamic dynamicFromValue(facebook::ABI33_0_0jsi::Runtime& runtime,
                                const facebook::ABI33_0_0jsi::Value& value);

}
}
