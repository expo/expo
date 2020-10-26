/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

#include <folly/dynamic.h>

namespace facebook {
namespace cxxutils {

folly::dynamic convertIdToFollyDynamic(id json, bool nullifyNanAndInf = false);
id convertFollyDynamicToId(const folly::dynamic& dyn);

} // namespace cxxutils
} // namespace facebook
